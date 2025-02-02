import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

export class TokenDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  code: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  refreshToken?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  clientSecret?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsUrl()
  @IsOptional()
  redirectUri?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsEnum(['authorization_code', 'refresh_token'])
  grantType: string;
}
