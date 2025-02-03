import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

import { ClientScope, ClientScopes } from '../types/scopes.type';

export class CreateClientDto {
  @ApiProperty({
    description: 'The unique id of the client',
    example: 'client-1',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'The name of the client',
    example: 'client-1',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The urls of the client',
    example: ['http://localhost:3000'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsUrl({ require_tld: false }, { each: true })
  @IsOptional()
  urls?: string[];
}

export class UpdateClientDto {
  @ApiProperty({
    description: 'The name of the client',
    example: 'client-1',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'The urls of the client',
    example: ['http://localhost:3000'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsUrl({ require_tld: false }, { each: true })
  @IsOptional()
  urls?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsIn(ClientScopes, { each: true })
  @IsOptional()
  scopes?: ClientScope[];

  @IsArray()
  @IsString({ each: true })
  @IsIn(ClientScopes, { each: true })
  @IsOptional()
  optionalScopes?: ClientScope[];

  @IsBoolean()
  @IsOptional()
  idTokenAllowed?: boolean;

  @IsBoolean()
  @IsOptional()
  implicitAllowed?: boolean;
}
