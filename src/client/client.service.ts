import { Injectable, Logger } from '@nestjs/common';
import { ClientRepository } from './client.repository';
import { HttpService } from '@nestjs/axios';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { Client, User } from '@prisma/client';
import { ClientResDto } from './dto/res/clientRes.dto';
import { CreateClientDto } from './dto/req/createClient.dto';
import { ClientCredentialResDto } from './dto/res/ClinetCredential.dto';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getClientList(user: Omit<User, 'password'>): Promise<ClientResDto[]> {
    this.logger.log(`getClientList: user=${JSON.stringify(user)}`);
    return (await this.clientRepository.findClientsByUserUuid(user.uuid)).map(
      this.convertToClientResDto,
    );
  }

  async getClient(
    uuid: string,
    user: Omit<User, 'password'>,
  ): Promise<ClientResDto> {
    this.logger.log(`getClient: uuid=${uuid}`);
    return this.convertToClientResDto(
      await this.clientRepository.findClientByUuidAndUserUuid(uuid, user.uuid),
    );
  }

  async registerClient(
    { id, name, urls }: CreateClientDto,
    user: Omit<User, 'password'>,
  ): Promise<ClientCredentialResDto> {
    this.logger.log(`registerClient: id=${id}, name=${name}`);
    const { secretKey, hashed } = this.generateClientSecret();
    const client = await this.clientRepository.createClient(
      {
        id,
        name,
        urls,
        password: hashed,
      },
      user.uuid,
    );
    return {
      uuid: client.uuid,
      id: client.id,
      clientSecret: secretKey,
    };
  }

  private generateClientSecret(): { secretKey: string; hashed: string } {
    const secretKey = Math.random().toString(36).substring(2, 12);
    return {
      secretKey,
      hashed: bcrypt.hashSync(secretKey, bcrypt.genSaltSync(10)),
    };
  }

  private convertToClientResDto({
    urls,
    ...rest
  }: Omit<Client, 'id' | 'password'>): ClientResDto {
    if (urls === null) {
      return {
        ...rest,
        urls: [],
      };
    }
    const listUrls = urls as string[];
    return {
      ...rest,
      urls: listUrls,
    };
  }
}
