import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

import { ClientScopeList, ClientScopeType } from '../types/clientScopes.type';

export class CreateClientDto {
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

  @ApiProperty({
    description: 'The scopes which the client uses',
    example: ['email'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsIn(ClientScopeList, { each: true })
  @IsOptional()
  scopes?: ClientScopeType[];

  @ApiProperty({
    description: 'The scopes which the client might uses',
    example: ['student_id'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsIn(ClientScopeList, { each: true })
  @IsOptional()
  optionalScopes?: ClientScopeType[];

  @ApiProperty({
    description: 'whether using id token or not',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  idTokenAllowed?: boolean;
}
