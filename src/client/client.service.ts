import { Loggable } from '@lib/logger/decorator/loggable';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Client, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { ClientRepository } from './client.repository';
import { CreateClientDto, UpdateClientDto } from './dto/req.dto';
import { ClientWithConsent } from './types/clientWithConsent.type';

@Injectable()
@Loggable()
export class ClientService {
  constructor(private readonly clientRepository: ClientRepository) {}

  /**
   * Get client list
   * @param user the user who wants to get the client list
   * @returns client list
   */
  async getClientList(user: User): Promise<Client[]> {
    return this.clientRepository.findClientListByUserUuid(user.uuid);
  }

  /**
   * Get client information
   * @param uuid client's uuid
   * @param user user who wants to get the client
   * @returns client information
   */
  async getClient(uuid: string, user: User): Promise<Client> {
    return this.clientRepository.findClientByUuidAndUserUuid(uuid, user.uuid);
  }

  /**
   * Get client public information
   * @param uuid client's uuid
   * @param user user who wants to get the client
   * @returns client public information with specific user
   */
  async getClientPublicInformation(
    id: string,
    user: User,
  ): Promise<ClientWithConsent> {
    return this.clientRepository.findClientWithConsentByIdAndUserUuid(
      id,
      user.uuid,
    );
  }

  /**
   * Register client
   * @param param0 client information
   * @param user user who wants to register the client
   * @returns client credential information
   */
  async registerClient(
    { id, name, urls }: CreateClientDto,
    user: User,
  ): Promise<Client> {
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
    client.password = secretKey;
    return client;
  }

  /**
   * to reset the client secret, generate a new secret key and update the client secret
   * @param uuid client's uuid
   * @param user user who wants to reset the client secret
   * @returns client credential information
   */
  async resetClientSecret(uuid: string, user: User): Promise<Client> {
    const { secretKey, hashed } = this.generateClientSecret();
    const client = await this.clientRepository.updateClientPassword(
      {
        uuid,
        password: hashed,
      },
      user.uuid,
    );
    client.password = secretKey;
    return client;
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
    updateClientDto: UpdateClientDto,
    user: User,
  ): Promise<Client> {
    if (updateClientDto.optionalScopes && updateClientDto.scopes) {
      updateClientDto.optionalScopes = updateClientDto.optionalScopes.filter(
        (val) => !updateClientDto.scopes?.includes(val),
      );
    }
    return this.clientRepository.updateClient(
      { uuid, ...updateClientDto },
      user.uuid,
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
   * validate the client
   * @param id client's id
   * @param secret client's secret
   * @returns client information if the client is valid
   */
  async validateClient(id: string, secret: string): Promise<Client> {
    const client = await this.clientRepository.findById(id);
    if (!bcrypt.compareSync(secret, client.password)) {
      throw new UnauthorizedException('invalid_client');
    }
    return client;
  }

  private generateClientSecret(): { secretKey: string; hashed: string } {
    const secretKey = crypto
      .randomBytes(32)
      .toString('base64')
      .replace(/[+//=]/g, '');
    return {
      secretKey,
      hashed: bcrypt.hashSync(secretKey, bcrypt.genSaltSync(10)),
    };
  }
}
