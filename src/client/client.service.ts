import { Injectable, Logger } from '@nestjs/common';
import { ClientRepository } from './client.repository';
import { HttpService } from '@nestjs/axios';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { Client } from '@prisma/client';
import { ClientResDto } from './dto/res/clientRes.dto';
import { CreateClientDto } from './dto/req/createClient.dto';
import { ClientCredentialResDto } from './dto/res/ClinetCredential.dto';
import { firstValueFrom } from 'rxjs';
import { UpdateClientDto } from './dto/req/updateClient.dto';
import { UserInfo } from 'src/idp/types/userInfo.type';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getClientList(user: UserInfo): Promise<ClientResDto[]> {
    this.logger.log(`getClientList: user=${JSON.stringify(user)}`);
    return (await this.clientRepository.findClientsByUserUuid(user.uuid)).map(
      this.convertToClientResDto,
    );
  }

  async getClient(uuid: string, user: UserInfo): Promise<ClientResDto> {
    this.logger.log(`getClient: uuid=${uuid}`);
    return this.convertToClientResDto(
      await this.clientRepository.findClientByUuidAndUserUuid(uuid, user.uuid),
    );
  }

  async registerClient(
    { id, name, urls }: CreateClientDto,
    user: UserInfo,
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

  async resetClientSecret(
    uuid: string,
    user: UserInfo,
  ): Promise<ClientCredentialResDto> {
    this.logger.log(`resetClientSecret: uuid=${uuid}`);
    const { secretKey, hashed } = this.generateClientSecret();
    const client = await this.clientRepository.updateClientSecret(
      {
        uuid,
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

  async updateClient(
    uuid: string,
    { name, urls }: UpdateClientDto,
    user: UserInfo,
  ): Promise<ClientResDto> {
    this.logger.log(`updateClient: uuid=${uuid}`);
    return this.convertToClientResDto(
      await this.clientRepository.updateClient({ uuid, name, urls }, user.uuid),
    );
  }

  async validateUri(id: string, url: string): Promise<boolean> {
    const client = await this.clientRepository.findById(id);
    if (client.urls.length === 0) return false;
    return client.urls.includes(url);
  }

  async adminRequest(uuid: string, user: UserInfo): Promise<void> {
    this.logger.log(`adminRequest: uuid=${uuid}`);
    const { name } = await this.clientRepository.findClientByUuidAndUserUuid(
      uuid,
      user.uuid,
    );
    await firstValueFrom(
      this.httpService.post(
        this.configService.getOrThrow<string>('SLACK_WEBHOOK_URL'),
        {
          text: `Service server sends permission request for client ${name}(${uuid})`,
          attachments: [
            {
              color: '#36a64f',
              title: 'Details',
              fields: [
                { title: 'client name', value: name },
                { title: 'client uuid', value: uuid },
                { title: 'user id', value: user.uuid },
              ],
            },
          ],
        },
      ),
    );
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
