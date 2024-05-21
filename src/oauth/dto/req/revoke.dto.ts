import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class RevokeDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  token: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientSecret: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['access_token', 'refresh_token'])
  tokenTypeHint: 'access_token' | 'refresh_token';
}
