import { ApiProperty } from '@nestjs/swagger';
import { Client, Role } from '@prisma/client';

export class ClientResDto implements Omit<Client, 'password' | 'id'> {
  @ApiProperty({
    description: 'The UUID of the client',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  uuid: string;

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
    description: 'The role of the client',
    example: 'admin',
  })
  role: Role;

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
}
