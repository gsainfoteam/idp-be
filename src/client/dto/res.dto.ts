import { ApiProperty } from '@nestjs/swagger';
import { Client } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

import { ClientWithConsent } from '../types/clientWithConsent.type';

export class ClientResDto implements Client {
  @ApiProperty({
    description: 'The UUID of the client',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  uuid: string;

  @ApiProperty({
    description: 'The name of the client',
    example: 'client id',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the client',
    example: 'client name',
  })
  name: string;

  @ApiProperty({
    description: 'The urls of the client',
    example: ['https://example.com'],
  })
  @ApiProperty()
  urls: string[];

  @ApiProperty({
    description: 'The date the client was created',
    example: '2021-07-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date the client was last updated',
    example: '2021-07-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: "the scope which need to use the client's service",
    example: ['profile', 'email'],
  })
  scopes: string[];

  @ApiProperty({
    description: "the scope whether need or not in the client's service",
    example: ['student_id'],
  })
  optionalScopes: string[];

  @ApiProperty({
    description: 'whether the client has authority to use id token or not',
    example: true,
  })
  idTokenAllowed: boolean;

  @ApiProperty({
    description:
      'whether the client has authority to use implicit method or not',
    example: false,
  })
  implicitAllowed: boolean;

  @Exclude()
  password: string;

  constructor(client: Client) {
    Object.assign(this, client);
  }
}

export class ClientCredentialResDto implements Client {
  @ApiProperty({
    description: 'Client UUID',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  uuid: string;

  @ApiProperty({
    description: 'Client ID',
    example: 'client-id',
  })
  id: string;

  @ApiProperty({
    description: 'Client Secret',
    example: 'client-secret',
  })
  @Expose()
  get clientSecret(): string {
    return this.password;
  }

  @Exclude()
  name: string;

  @Exclude()
  password: string;

  @Exclude()
  urls: string[];

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  idTokenAllowed: boolean;

  @Exclude()
  implicitAllowed: boolean;

  @Exclude()
  scopes: string[];

  @Exclude()
  optionalScopes: string[];

  constructor(client: Client) {
    Object.assign(this, client);
  }
}

export class ClientPublicResDto implements ClientWithConsent {
  @ApiProperty({
    description: 'The UUID of the client',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  uuid: string;

  @ApiProperty({
    description: 'The id of the client',
    example: 'client id',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the client',
    example: 'client name',
  })
  name: string;

  @ApiProperty({
    description: "the scope which need to use the client's service",
    example: ['profile', 'email'],
  })
  scopes: string[];

  @ApiProperty({
    description: "the scope whether need or not in the client's service",
    example: ['student_id'],
  })
  optionalScopes: string[];

  @ApiProperty({
    description: 'Scopes that the user has recently consented to',
    example: ['openid', 'profile', 'email'],
  })
  @Expose()
  get recentConsent(): string[] {
    return this.consent.flatMap((consent) => consent.scopes) ?? [];
  }

  @Exclude()
  password: string;

  @Exclude()
  urls: string[];

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  consent: { scopes: string[] }[];

  @Exclude()
  idTokenAllowed: boolean;

  @Exclude()
  implicitAllowed: boolean;

  constructor(client: ClientWithConsent) {
    Object.assign(this, client);
  }
}
