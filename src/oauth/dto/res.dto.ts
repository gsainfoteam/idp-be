import { ApiProperty } from '@nestjs/swagger';

import { ScopeList, ScopeType } from '../types/scope.type';

export class TokenResDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV9',
    description: 'access token',
  })
  access_token: string;

  @ApiProperty({
    example: 'Bearer',
    description: 'token type',
  })
  token_type: string;

  @ApiProperty({
    example: 3600,
    description: 'expires in',
  })
  expires_in: number;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV9',
    description: 'refresh token',
  })
  refresh_token: string;

  @ApiProperty({
    example: 'openid profile email',
    description: 'scope',
    enum: ScopeList,
  })
  scope: ScopeType[];
}
