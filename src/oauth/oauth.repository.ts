import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Scope } from './types/Scopes.type';
import { UserInfo } from 'src/idp/types/userInfo.type';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ExtendedRefreshToken } from './types/extendedRefreshToken.type';

const MAX_REFRESH_TOKEN_COUNT = 10;

@Injectable()
export class OauthRepository {
  private readonly logger = new Logger(OauthRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async updateUserConsent(
    user: UserInfo,
    scope: Readonly<Scope[]>,
    clientId: string,
  ): Promise<void> {
    this.logger.log(`updateUserConsent: user=${JSON.stringify(user)}`);
    await this.prismaService.consent.update({
      where: {
        clientUuid_userUuid: {
          clientUuid: clientId,
          userUuid: user.uuid,
        },
      },
      data: {
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
    await this.prismaService.$transaction([
      this.prismaService.refreshToken.create({
        data: {
          token,
          scopes: [...scopes],
          consent: {
            connect: {
              clientUuid_userUuid: {
                clientUuid: clientId,
                userUuid: user.uuid,
              },
            },
          },
        },
      }),
      this.prismaService.consent.update({
        where: {
          clientUuid_userUuid: {
            clientUuid: clientId,
            userUuid: user.uuid,
          },
        },
        data: {
          refreshToken: {
            delete: (
              await this.prismaService.refreshToken.findMany({
                where: {
                  consent: {
                    clientUuid: clientId,
                    userUuid: user.uuid,
                  },
                  updatedAt: {
                    lte: new Date(
                      new Date().getTime() - 1000 * 60 * 60 * 24 * 30,
                    ),
                  },
                },
                select: {
                  token: true,
                },
                orderBy: {
                  updatedAt: 'asc',
                },
              })
            ).slice(0, MAX_REFRESH_TOKEN_COUNT),
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
    await this.prismaService.refreshToken.delete({
      where: {
        token,
        clientUuid: clientId,
      },
    });
  }
}
