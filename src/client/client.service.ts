import { Injectable, Logger } from '@nestjs/common';
import { ClientRepository } from './client.repository';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Client, User } from '@prisma/client';
import { ClientResDto } from './dto/res/clientRes.dto';

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
