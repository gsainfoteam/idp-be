import { ApiPropertyOptional } from '@nestjs/swagger';

export class TokenResDto {
  @ApiPropertyOptional()
  accessToken?: string;

  @ApiPropertyOptional()
  tokenType?: string;

  @ApiPropertyOptional()
  expiresIn?: number;

  @ApiPropertyOptional()
  scope?: string;

  @ApiPropertyOptional()
  idToken?: string;

  @ApiPropertyOptional()
  refreshToken?: string;
}
