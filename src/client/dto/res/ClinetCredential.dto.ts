import { ApiProperty } from '@nestjs/swagger';

export class ClientCredentialResDto {
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
  clientSecret: string;
}
