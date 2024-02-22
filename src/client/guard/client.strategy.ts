import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy } from 'passport-http';
import { ClientService } from '../client.service';
import { Client } from '@prisma/client';

@Injectable()
export class ClientStrategy extends PassportStrategy(BasicStrategy, 'client') {
  constructor(private readonly clientService: ClientService) {
    super();
  }

  async validate(id: string, secret: string): Promise<Client> {
    return this.clientService.validateClient(id, secret);
  }
}
