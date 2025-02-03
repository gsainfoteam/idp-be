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

import { ClientWithConsent } from './types/clientWithConsent.type';

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

  async findById(id: string): Promise<Client> {
    return this.prismaService.client
      .findUniqueOrThrow({
        where: {
          id,
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          this.logger.debug(`findById error: ${error.stack}`);
          throw new ForbiddenException();
        }
        this.logger.error(`findById error: ${error}`);
        throw new InternalServerErrorException();
      });
  }

  async findClientWithConsentByIdAndUserUuid(
    id: string,
    userUuid: string,
  ): Promise<ClientWithConsent> {
    return this.prismaService.client
      .findUniqueOrThrow({
        where: { id },
        include: {
          consent: {
            where: { user: { uuid: userUuid } },
            select: { scopes: true },
          },
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          this.logger.debug(
            `findClientWithConsentByIdAndUserUuid error: ${error.stack}`,
          );
          throw new ForbiddenException();
        }
        this.logger.error(
          `findClientWithConsentByIdAndUserUuid error: ${error}`,
        );
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
      id,
      name,
      urls,
      password,
    }: Pick<Client, 'id' | 'name' | 'password'> & Partial<Pick<Client, 'urls'>>,
    userUuid: string,
  ): Promise<Client> {
    return this.prismaService.client
      .create({
        data: {
          id,
          name,
          urls,
          password,
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

  async updateClientPassword(
    { uuid, password }: Pick<Client, 'uuid' | 'password'>,
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
          password,
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
      implicitAllowed,
    }: Pick<Client, 'uuid'> &
      Partial<
        Pick<
          Client,
          | 'name'
          | 'urls'
          | 'scopes'
          | 'optionalScopes'
          | 'idTokenAllowed'
          | 'implicitAllowed'
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
          implicitAllowed,
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
}
