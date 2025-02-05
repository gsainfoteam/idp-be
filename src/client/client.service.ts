import { Loggable } from '@lib/logger/decorator/loggable';
import { Injectable } from '@nestjs/common';
import { Client, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { ClientRepository } from './client.repository';
import { CreateClientDto, UpdateClientDto } from './dto/req.dto';

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
   * Register client
   * @param param0 client information
   * @param user user who wants to register the client
   * @returns client credential information
   */
  async registerClient(
    { name, urls }: CreateClientDto,
    user: User,
  ): Promise<Client> {
    const { secretKey, hashed } = this.generateClientSecret();
    const client = await this.clientRepository.createClient(
      {
        name,
        urls,
        secret: hashed,
      },
      user.uuid,
    );
    client.secret = secretKey;
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
    const client = await this.clientRepository.updateClientSecret(
      {
        uuid,
        secret: hashed,
      },
      user.uuid,
    );
    client.secret = secretKey;
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
