import { Loggable } from '@lib/logger/decorator/loggable';
import { ObjectService } from '@lib/object';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Client, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { SlackService } from 'nestjs-slack';

import { ClientRepository } from './client.repository';
import { CreateClientDto, UpdateClientDto } from './dto/req.dto';
import { UpdateClientPictureResDto } from './dto/res.dto';

@Injectable()
@Loggable()
export class ClientService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly slackService: SlackService,
    private readonly objectService: ObjectService,
  ) {}

  /**
   * Get client list
   * @param user the user who wants to get the client list
   * @returns client list
   */
  async getClientList(user: User): Promise<Client[]> {
    return (
      await this.clientRepository.findClientListByUserUuid(user.uuid)
    ).map(
      (client: Client): Client => ({
        ...client,
        picture:
          client.picture === null
            ? null
            : this.objectService.getUrl(client.picture),
      }),
    );
  }

  /**
   * Get client information
   * @param uuid client's uuid
   * @param user user who wants to get the client
   * @returns client information
   */
  async getClient(uuid: string, user: User): Promise<Client> {
    const client = await this.clientRepository.findClientByUuidAndUserUuid(
      uuid,
      user.uuid,
    );
    return {
      ...client,
      picture:
        client.picture === null
          ? null
          : this.objectService.getUrl(client.picture),
    };
  }

  /**
   * Get client information only by uuid
   * @param uuid Client's uuid
   * @returns client information
   */
  async getClientByUuid(uuid: string): Promise<Client> {
    const client = await this.clientRepository.findClientByUuid(uuid);
    return {
      ...client,
      picture:
        client.picture === null
          ? null
          : this.objectService.getUrl(client.picture),
    };
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

  /**
   * update client picture
   * @param uuid client's uuid
   * @param user user who wants to update the client
   */
  async updateClientPicture(
    length: number,
    uuid: string,
    userUuid: string,
  ): Promise<UpdateClientPictureResDto> {
    const key = `client/${uuid}/client_${crypto.randomBytes(16).toString('base64')}.webp`;
    const presignedUrl = await this.objectService.createPresignedUrl(
      key,
      length,
    );
    await this.clientRepository.updateClientPicture(key, uuid, userUuid);
    return {
      presignedUrl,
    };
  }

  /**
   * send delete request from user to infoteam slack channel
   * @param uuid client's uuid
   * @param user user who wants to delete the client
   */
  async deleteClientRequest(uuid: string, user: User): Promise<void> {
    const client = await this.clientRepository.findClientByUuidAndUserUuid(
      uuid,
      user.uuid,
    );
    if (!client) {
      throw new ForbiddenException('User or client not valid');
    }
    await this.slackService.postMessage({
      username: 'IDP_REQUEST',
      icon_emoji: ':warning:',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `Client delete request`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Client Name:*\n${client.name}`,
            },
            {
              type: 'mrkdwn',
              text: `*Client ID:*\n${client.uuid}`,
            },
            {
              type: 'mrkdwn',
              text: `*User Email:*\n${user.email}`,
            },
            {
              type: 'mrkdwn',
              text: `*User ID:*\n${user.uuid}`,
            },
          ],
        },
      ],
    });
    await this.clientRepository.deleteRequestClient(uuid, user.uuid);
  }

  async deleteClientPicture(uuid: string, userUuid: string): Promise<void> {
    const client = await this.clientRepository.findClientByUuidAndUserUuid(
      uuid,
      userUuid,
    );
    if (!client.picture) {
      throw new ForbiddenException('Client picture not found');
    }
    await this.objectService.deleteObject(client.picture);
    await this.clientRepository.deleteClientPicture(uuid, userUuid);
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
