import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class RevokeDto {
  @ApiProperty()
  @IsString()
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
