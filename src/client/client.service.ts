import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ClientRepository } from './client.repository';
import { HttpService } from '@nestjs/axios';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Client } from '@prisma/client';
import { ClientResDto } from './dto/res/clientRes.dto';
import { CreateClientDto } from './dto/req/createClient.dto';
import { ClientCredentialResDto } from './dto/res/ClinetCredential.dto';
import { firstValueFrom } from 'rxjs';
import { UpdateClientDto } from './dto/req/updateClient.dto';
import { UserInfo } from 'src/idp/types/userInfo.type';
import { ClientPublicResDto } from './dto/res/clientPublicRes.dto';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get client list
   * @param user the user who wants to get the client list
   * @returns client list
   */
  async getClientList(user: UserInfo): Promise<ClientResDto[]> {
    this.logger.log(`getClientList: user=${JSON.stringify(user)}`);
    return (await this.clientRepository.findClientsByUserUuid(user.uuid)).map(
      this.convertToClientResDto,
    );
  }

  /**
   * Get client information
   * @param uuid client's uuid
   * @param user user who wants to get the client
   * @returns client information
   */
  async getClient(uuid: string, user: UserInfo): Promise<ClientResDto> {
    this.logger.log(`getClient: uuid=${uuid}`);
    return this.convertToClientResDto(
      await this.clientRepository.findClientByUuidAndUserUuid(uuid, user.uuid),
    );
  }

  /**
   * Get client public information
   * @param uuid client's uuid
   * @param user user who wants to get the client
   * @returns client public information with specific user
   */
  async getClientPublicInformation(
    id: string,
    user: UserInfo,
  ): Promise<ClientPublicResDto> {
    this.logger.log(`getClientPublicInformation: id=${id}`);
    const client =
      await this.clientRepository.findClientWithConsentByIdAndUserUuid(
        id,
        user.uuid,
      );
    return {
      id: client.id,
      name: client.name,
      uuid: client.uuid,
      recentConsent: client.consent.flatMap((consent) => consent.scopes),
    };
  }

  /**
   * Register client
   * @param param0 client information
   * @param user user who wants to register the client
   * @returns client credential information
   */
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

  /**
   * to reset the client secret, generate a new secret key and update the client secret
   * @param uuid client's uuid
   * @param user user who wants to reset the client secret
   * @returns client credential information
   */
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

  /**
   * update client information (name, urls)
   * @param uuid client's uuid
   * @param param1 client's name and urls that will be updated
   * @param user user who wants to update the client
   * @returns updated client information
   */
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

  /**
   * validate the uri
   * @param id client's id
   * @param url url that will be validated
   * @returns true if the url is valid
   */
  async validateUri(id: string, url: string): Promise<boolean> {
    const client = await this.clientRepository.findById(id);
    if (client.urls.length === 0) return false;
    return client.urls.includes(url);
  }

  /**
   * send a slack message to notify the permission request
   * @param uuid client's uuid
   * @param user user who sends the permission request
   */
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

  /**
   * validate the client
   * @param id client's id
   * @param secret client's secret
   * @returns client information if the client is valid
   */
  async validateClient(id: string, secret: string): Promise<Client> {
    const client = await this.clientRepository.findById(id).catch((error) => {
      this.logger.error(`validateClient: error=${error}`);
      throw new UnauthorizedException('invalid_client');
    });
    if (
      !(await bcrypt.compare(secret, client.password).catch(() => {
        throw new UnauthorizedException('invalid_client');
      }))
    ) {
      throw new UnauthorizedException('invalid_client');
    }
    return this.clientRepository.findById(id);
  }

  private generateClientSecret(): { secretKey: string; hashed: string } {
    const secretKey = crypto
      .randomBytes(32)
      .toString('base64')
      .replace(/[+\/=]/g, '');
    return {
      secretKey,
      hashed: bcrypt.hashSync(secretKey, bcrypt.genSaltSync(10)),
    };
  }

  /**
   * convert client to client response dto
   * @param param0 Client
   * @returns ClientResDto
   */
  private convertToClientResDto({
    urls,
    ...rest
  }: Omit<Client, 'password'>): ClientResDto {
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
