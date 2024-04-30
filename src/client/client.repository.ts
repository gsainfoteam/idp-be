import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Client } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConsentClient } from './types/consentClient.type';

@Injectable()
export class ClientRepository {
  private readonly logger = new Logger(ClientRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async findClientsByUserUuid(
    userUuid: string,
  ): Promise<Omit<Client, 'password'>[]> {
    this.logger.log(`findClientsByUserUuid: userUuid=${userUuid}`);
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
    this.logger.log(`findById: id=${id}`);
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
          this.logger.debug(`findById: error=${error}`);
          throw new ForbiddenException();
        }
        this.logger.error(`findById: error=${error}`);
        throw new InternalServerErrorException();
      });
  }

  async findClientWithConsentByIdAndUserUuid(
    id: string,
    userUuid: string,
  ): Promise<ConsentClient> {
    this.logger.log(`findClientWithConsentByIdAndUserUuid: id=${id}`);
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
            `findClientWithConsentByIdAndUserUuid: error=${error}`,
          );
          throw new ForbiddenException();
        }
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
    this.logger.log(`findClientByUuidAndUserUuid: uuid=${uuid}`);
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
          this.logger.debug(`findClientByUuidAndUserUuid: error=${error}`);
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
    this.logger.log(`createClient: id=${id}, name=${name}`);
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
          this.logger.debug(`createClient: error=${error}`);
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
    this.logger.log(`updateClientSecret: uuid=${uuid}`);
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
          this.logger.debug(`updateClientSecret: error=${error}`);
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
    this.logger.log(`updateClient: uuid=${uuid}`);
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
          this.logger.debug(`updateClient: error=${error}`);
          throw new ForbiddenException();
        }
        this.logger.error(`updateClient: error=${error}`);
        throw new InternalServerErrorException();
      });
  }
}
