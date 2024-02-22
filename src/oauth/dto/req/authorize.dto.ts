import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { Scope, allowedScopes } from 'src/oauth/types/Scopes.type';
import { responseType, ResponseType } from 'src/oauth/types/response.type';

export class AuthorizeDto {
  @ApiProperty({
    description: 'The client id',
    example: '1234567890',
  })
  @IsString()
  clientId: string;

  @ApiProperty({
    description: 'The redirect uri',
    example: 'https://example.com',
  })
  @IsString()
  @IsUrl(
    {
      require_valid_protocol: false,
      require_tld: false,
      require_host: false,
    },
    {
      message: 'redirectUri must be a valid URL',
    },
  )
  redirectUri: string;

  @ApiProperty({
    description: 'The state',
    example: '1234567890',
  })
  @IsString()
  @IsOptional()
  nonce?: string;

  @ApiProperty({
    description: 'The scope',
    example: 'openid profile email',
  })
  @IsArray()
  @IsEnum(allowedScopes, { each: true, message: 'scope must be a valid scope' })
  @Transform(({ value }) => value.split(' '))
  scope: Readonly<Scope[]>;

  @ApiProperty({
    description: 'The response type',
    example: 'code token',
  })
  @IsArray()
  @IsEnum(responseType, {
    each: true,
    message: 'responseType must be a valid response type',
  })
  @Transform(({ value }) => value.split(' '))
  responseType: Readonly<ResponseType[]>;
}
