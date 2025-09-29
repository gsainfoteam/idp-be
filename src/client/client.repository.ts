import { Loggable } from '@lib/logger/decorator/loggable';
import { PrismaService } from '@lib/prisma';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Client, RoleType } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
@Loggable()
export class ClientRepository {
  private readonly logger = new Logger(ClientRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async findClientListByUserUuid(userUuid: string): Promise<Client[]> {
    return this.prismaService.client.findMany({
      where: {
        userLinks: {
          some: {
            userUuid: userUuid,
          },
        },
      },
    });
  }

  async findClientByUuid(uuid: string): Promise<Client> {
    return this.prismaService.client
      .findUniqueOrThrow({
        where: {
          uuid,
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code == 'P2025'
        ) {
          this.logger.debug(`findClientByUuid error: ${error.stack}`);
          throw new ForbiddenException();
        }
        this.logger.error(`findClientByUuid error: ${error}`);
        throw new InternalServerErrorException();
      });
  }

  async findClientByUuidAndUserUuid(
    uuid: string,
    userUuid: string,
  ): Promise<Client> {
    return this.prismaService.client
      .findUniqueOrThrow({
        where: {
          uuid,
          userLinks: {
            some: {
              userUuid: userUuid,
            },
          },
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          this.logger.debug(
            `findClientByUuidAndUserUuid error: ${error.stack}`,
          );
          throw new ForbiddenException();
        }
        this.logger.error(`findClientByUuidAndUserUuid error: ${error}`);
        throw new InternalServerErrorException();
      });
  }

  async createClient(
    {
      name,
      urls,
      secret,
    }: Pick<Client, 'name' | 'secret'> & Partial<Pick<Client, 'urls'>>,
    userUuid: string,
  ): Promise<Client> {
    return this.prismaService.client
      .create({
        data: {
          name,
          urls,
          secret,
          userLinks: {
            create: {
              userUuid: userUuid,
              role: RoleType.OWNER,
            },
          },
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          this.logger.debug(`createClient: error=${error.stack}`);
          throw new ConflictException('Client already exists');
        }
        this.logger.error(`createClient error: ${error}`);
        throw new InternalServerErrorException();
      });
  }

  async updateClientSecret(
    { uuid, secret }: Pick<Client, 'uuid' | 'secret'>,
    userUuid: string,
  ): Promise<Client> {
    return this.prismaService.client
      .update({
        where: {
          uuid,
          userLinks: {
            some: {
              userUuid: userUuid,
            },
          },
        },
        data: {
          secret,
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          this.logger.debug(`updateClientSecret: error=${error.stack}`);
          throw new ForbiddenException();
        }
        this.logger.error(`updateClientSecret: error=${error}`);
        throw new InternalServerErrorException();
      });
  }

  async updateClient(
    {
      uuid,
      name,
      urls,
      scopes,
      optionalScopes,
      idTokenAllowed,
    }: Pick<Client, 'uuid'> &
      Partial<
        Pick<
          Client,
          'name' | 'urls' | 'scopes' | 'optionalScopes' | 'idTokenAllowed'
        >
      >,
    userUuid: string,
  ): Promise<Client> {
    return this.prismaService.client
      .update({
        where: {
          uuid,
          userLinks: {
            some: {
              userUuid: userUuid,
            },
          },
        },
        data: {
          name,
          urls,
          scopes,
          optionalScopes,
          idTokenAllowed,
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          this.logger.debug(`updateClient error: ${error.stack}`);
          throw new ForbiddenException();
        }
        this.logger.error(`updateClient error: ${error}`);
        throw new InternalServerErrorException();
      });
  }

  async addMemberToClient(uuid: string, memberEmail: string): Promise<void> {
    const member = await this.prismaService.user.findUnique({
      where: { email: memberEmail },
    });
    if (!member) throw new NotFoundException('User not found');
    try {
      await this.prismaService.client.update({
        where: {
          uuid: uuid,
        },
        data: {
          userLinks: {
            create: {
              userUuid: member.uuid,
              role: RoleType.MEMBER,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        this.logger.debug(`addMemberToClient error: ${error.stack}`);
        if (error.code === 'P2025') {
          throw new ForbiddenException();
        }
        if (error.code === 'P2002') {
          throw new ConflictException('Already a member');
        }
      }
      this.logger.error(`addMemberToClient error: ${error}`);
      throw new InternalServerErrorException();
    }
  }

  async updateClientPicture(
    picture: string,
    uuid: string,
    userUuid: string,
  ): Promise<Client> {
    return this.prismaService.client
      .update({
        where: {
          uuid,
          userLinks: {
            some: {
              userUuid: userUuid,
            },
          },
        },
        data: {
          picture,
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          this.logger.debug(`updateClientPicture error: ${error.stack}`);
          throw new ForbiddenException();
        }
        this.logger.error(`updateClientPicture error: ${error}`);
        throw new InternalServerErrorException();
      });
  }

  async giveAdminToUser(uuid: string, userUuid: string): Promise<void> {
    const member = await this.prismaService.user.findUnique({
      where: { uuid: userUuid },
    });
    if (!member) throw new NotFoundException('User not found');
    try {
      await this.prismaService.userClientRelation.update({
        where: {
          userUuid_clientUuid: {
            userUuid: userUuid,
            clientUuid: uuid,
          },
        },
        data: { role: RoleType.ADMIN },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        this.logger.debug(`giveAdminToUser error: ${error.stack}`);
        if (error.code === 'P2025') {
          throw new ForbiddenException();
        }
      }
      this.logger.error(`giveAdminToUser error: ${error}`);
      throw new InternalServerErrorException();
    }
  }

  async removeAdminFromUser(uuid: string, userUuid: string): Promise<void> {
    const member = await this.prismaService.user.findUnique({
      where: { uuid: userUuid },
    });
    if (!member) throw new NotFoundException('User not found');
    try {
      await this.prismaService.userClientRelation.update({
        where: {
          userUuid_clientUuid: {
            userUuid: userUuid,
            clientUuid: uuid,
          },
        },
        data: { role: RoleType.MEMBER },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        this.logger.debug(`removeAdminFromUser error: ${error.stack}`);
        if (error.code === 'P2025') {
          throw new ForbiddenException();
        }
      }
      this.logger.error(`removeAdminFromUser error: ${error}`);
      throw new InternalServerErrorException();
    }
  }

  async deleteRequestClient(uuid: string, userUuid: string): Promise<void> {
    await this.prismaService.client
      .update({
        where: {
          uuid,
          userLinks: {
            some: {
              userUuid: userUuid,
            },
          },
        },
        data: {
          deleteRequestedAt: new Date(),
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          this.logger.debug(`deleteRequestClient error: ${error.stack}`);
          throw new ForbiddenException();
        }
        this.logger.error(`deleteRequestClient error: ${error}`);
        throw new InternalServerErrorException();
      });
  }

  async removeMemberFromClient(
    uuid: string,
    memberEmail: string,
  ): Promise<void> {
    const member = await this.prismaService.user.findUnique({
      where: {
        email: memberEmail,
      },
    });
    if (!member) throw new NotFoundException('User not found');

    try {
      await this.prismaService.client.update({
        where: {
          uuid: uuid,
        },
        data: {
          userLinks: {
            delete: {
              userUuid_clientUuid: {
                userUuid: member.uuid,
                clientUuid: uuid,
              },
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.debug(`removeMemberFromClient error: ${error.stack}`);
        throw new ForbiddenException();
      }
      this.logger.error(`removeMemberFromClient error: ${error}`);
      throw new InternalServerErrorException();
    }
  }

  async deleteClientPicture(uuid: string, userUuid: string): Promise<void> {
    await this.prismaService.client
      .update({
        where: {
          uuid,
          userLinks: {
            some: {
              userUuid: userUuid,
            },
          },
        },
        data: {
          picture: null,
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          this.logger.debug(`deleteClientPicture error: ${error.stack}`);
          throw new ForbiddenException();
        }
        this.logger.error(`deleteClientPicture error: ${error}`);
        throw new InternalServerErrorException();
      });
  }
}
