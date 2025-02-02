import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Scope } from './types/Scopes.type';
import { UserInfo } from 'src/idp/types/userInfo.type';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ExtendedRefreshToken } from './types/extendedRefreshToken.type';
import { Loggable } from '@lib/logger/decorator/loggable';
import { PrismaService } from '@lib/prisma';

const MAX_REFRESH_TOKEN_COUNT = 10;

@Injectable()
@Loggable()
export class OauthRepository {
  private readonly logger = new Logger(OauthRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async updateUserConsent(
    user: UserInfo,
    scope: Readonly<Scope[]>,
    clientId: string,
  ): Promise<void> {
    // TODO: reduce this query
    const client = await this.prismaService.client.findUniqueOrThrow({
      where: {
        id: clientId,
      },
    });
    await this.prismaService.consent.upsert({
      where: {
        clientUuid_userUuid: {
          clientUuid: client?.uuid,
          userUuid: user.uuid,
        },
      },
      create: {
        client: {
          connect: {
            id: client.id,
          },
        },
        user: {
          connect: {
            uuid: user.uuid,
          },
        },
        scopes: [...scope],
      },
      update: {
        scopes: [...scope],
      },
    });
  }

  async updateRefreshToken(
    user: UserInfo,
    clientId: string,
    token: string,
    scopes: Readonly<Scope[]>,
  ): Promise<void> {
    const boundaryDate = new Date(new Date().getMonth() - 1);
    const client = await this.prismaService.client.findUniqueOrThrow({
      where: {
        id: clientId,
      },
    });
    await this.prismaService.$transaction([
      this.prismaService.refreshToken.upsert({
        where: {
          token,
        },
        create: {
          token,
          scopes: [...scopes],
          consent: {
            connect: {
              clientUuid_userUuid: {
                clientUuid: client.uuid,
                userUuid: user.uuid,
              },
            },
          },
        },
        update: {
          scopes: [...scopes],
          consent: {
            connect: {
              clientUuid_userUuid: {
                clientUuid: client.uuid,
                userUuid: user.uuid,
              },
            },
          },
        },
      }),
      this.prismaService.consent.update({
        where: {
          clientUuid_userUuid: {
            clientUuid: client.uuid,
            userUuid: user.uuid,
          },
        },
        data: {
          refreshToken: {
            delete: (
              await this.prismaService.refreshToken.findMany({
                where: {
                  consent: {
                    clientUuid: client.uuid,
                    userUuid: user.uuid,
                  },
                },
                select: {
                  token: true,
                  updatedAt: true,
                },
                orderBy: {
                  updatedAt: 'desc',
                },
              })
            )
              .filter(({ updatedAt }) => {
                return updatedAt >= boundaryDate;
              })
              .slice(MAX_REFRESH_TOKEN_COUNT),
          },
        },
      }),
    ]);
  }

  async findRefreshToken(refreshToken: string): Promise<ExtendedRefreshToken> {
    return this.prismaService.refreshToken
      .findUniqueOrThrow({
        where: {
          token: refreshToken,
        },
        include: {
          consent: {
            include: {
              user: true,
            },
          },
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          this.logger.debug(`findRefreshToken: ${error.message}`);
          throw new BadRequestException('invalid_grant');
        }
        this.logger.error(`findRefreshToken: ${error.message}`);
        throw new InternalServerErrorException();
      });
  }

  async deleteRefreshToken(token: string, clientId: string): Promise<void> {
    const client = await this.prismaService.client.findUniqueOrThrow({
      where: {
        id: clientId,
      },
    });
    await this.prismaService.refreshToken.delete({
      where: {
        token,
        clientUuid: client.uuid,
      },
    });
  }
}
