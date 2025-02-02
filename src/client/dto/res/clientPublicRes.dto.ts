import { ApiProperty } from '@nestjs/swagger';
import { Client } from '@prisma/client';

export class ClientPublicResDto
  implements
    Omit<Client, 'password' | 'urls' | 'role' | 'createdAt' | 'updatedAt'>
{
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
    description: 'Scopes that the user has recently consented to',
    example: ['openid', 'profile', 'email'],
  })
  recentConsent: string[];
}
