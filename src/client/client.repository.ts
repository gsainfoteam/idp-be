import { Loggable } from '@lib/logger/decorator/loggable';
import { PrismaService } from '@lib/prisma';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Client } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
@Loggable()
export class ClientRepository {
  private readonly logger = new Logger(ClientRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async findClientListByUserUuid(userUuid: string): Promise<Client[]> {
    return this.prismaService.client.findMany({
      where: {
        member: {
          some: {
            uuid: userUuid,
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
          member: {
            some: {
              uuid: userUuid,
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
          member: {
            connect: {
              uuid: userUuid,
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
          member: {
            some: {
              uuid: userUuid,
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
          member: {
            some: {
              uuid: userUuid,
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

  async deleteClient(uuid: string, userUuid: string): Promise<void> {
    await this.prismaService.client
      .delete({
        where: {
          uuid,
          member: {
            some: {
              uuid: userUuid,
            },
          },
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          this.logger.debug(`deleteClient error: ${error.stack}`);
          throw new ForbiddenException();
        }
        this.logger.error(`deleteClient error: ${error}`);
        throw new InternalServerErrorException();
      });
  }
}
