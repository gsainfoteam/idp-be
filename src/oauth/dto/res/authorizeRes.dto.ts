import { ApiPropertyOptional } from '@nestjs/swagger';

export class AuthorizeResDto {
  @ApiPropertyOptional({ required: false })
  code?: string;

  @ApiPropertyOptional({ required: false })
  accessToken?: string;

  @ApiPropertyOptional({ required: false })
  tokenType?: string;

  @ApiPropertyOptional({ required: false })
  expiresIn?: number;

  @ApiPropertyOptional({ required: false })
  idToken?: string;

  @ApiPropertyOptional({ required: false })
  refreshToken?: string;
}
