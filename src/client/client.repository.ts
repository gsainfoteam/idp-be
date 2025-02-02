import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Client } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ConsentClient } from './types/consentClient.type';
import { Loggable } from '@lib/logger/decorator/loggable';
import { PrismaService } from '@lib/prisma';

@Injectable()
@Loggable()
export class ClientRepository {
  private readonly logger = new Logger(ClientRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async findClientsByUserUuid(
    userUuid: string,
  ): Promise<Omit<Client, 'password'>[]> {
    return this.prismaService.client.findMany({
      where: {
        member: {
          some: {
            uuid: userUuid,
          },
        },
      },
      select: {
        id: true,
        uuid: true,
        name: true,
        urls: true,
        role: true,
        createdAt: true,
        updatedAt: true,
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
          this.logger.debug(`findById: error=${error.stack}`);
          throw new ForbiddenException();
        }
        this.logger.error(`findById: error=${error}`);
        throw new InternalServerErrorException();
      });
  }

  async findClientWithConsentByIdAndUserUuid(
    id: string,
    userUuid: string,
  ): Promise<ConsentClient | null> {
    return this.prismaService.client
      .findUnique({
        where: { id },
        include: {
          consent: {
            where: { user: { uuid: userUuid } },
            select: { scopes: true },
          },
        },
      })
      .catch((error) => {
        this.logger.error(
          `findClientWithConsentByIdAndUserUuid: error=${error}`,
        );
        throw new InternalServerErrorException();
      });
  }

  async findClientByUuidAndUserUuid(
    uuid: string,
    userUuid: string,
  ): Promise<Omit<Client, 'password'>> {
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
        select: {
          id: true,
          uuid: true,
          name: true,
          urls: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          this.logger.debug(
            `findClientByUuidAndUserUuid: error=${error.stack}`,
          );
          throw new ForbiddenException();
        }
        this.logger.error(`findClientByUuidAndUserUuid: error=${error}`);
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
        this.logger.error(`createClient: error=${error}`);
        throw new InternalServerErrorException();
      });
  }

  async updateClientSecret(
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
    }: Pick<Client, 'uuid'> & Partial<Pick<Client, 'name' | 'urls'>>,
    userUuid: string,
  ): Promise<Omit<Client, 'password'>> {
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
        },
        select: {
          id: true,
          uuid: true,
          name: true,
          urls: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          this.logger.debug(`updateClient: error=${error.stack}`);
          throw new ForbiddenException();
        }
        this.logger.error(`updateClient: error=${error}`);
        throw new InternalServerErrorException();
      });
  }
}
