import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { ScopeList, ScopeType } from '../types/scope.type';

export class TokenResDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV9',
    description: 'access token',
    name: 'access_token',
  })
  @Expose({
    name: 'access_token',
    toPlainOnly: true,
  })
  accessToken: string;

  @ApiProperty({
    example: 'Bearer',
    description: 'token type',
    name: 'token_type',
  })
  @Expose({
    name: 'token_type',
    toPlainOnly: true,
  })
  tokenType: string;

  @ApiProperty({
    example: 3600,
    description: 'expires in',
    name: 'expires_in',
  })
  @Expose({
    name: 'expires_in',
    toPlainOnly: true,
  })
  expiresIn: number;

  @ApiPropertyOptional({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV9',
    description: 'refresh token',
    name: 'refresh_token',
  })
  @Expose({
    name: 'refresh_token',
    toPlainOnly: true,
  })
  refreshToken?: string;

  @ApiPropertyOptional({
    example: '84000',
    description: 'refresh token expires in',
    name: 'refresh_token_expires_in',
  })
  @Expose({
    name: 'refresh_token_expires_in',
    toPlainOnly: true,
  })
  refreshTokenExpiresIn?: number;

  @ApiPropertyOptional({
    example: 'ey...',
    description: 'id token',
    name: 'id_token',
  })
  @Expose({
    name: 'id_token',
    toPlainOnly: true,
  })
  idToken?: string;

  @ApiProperty({
    example: 'openid profile email',
    description: 'scope',
    enum: ScopeList,
  })
  scope: ScopeType[];
}

export class UserInfoResDto {
  @ApiProperty({
    example: '1234567890',
    description: 'sub',
  })
  sub: string;

  @ApiPropertyOptional({
    example: 'https://example.com/profile',
    description: 'profile url',
    required: false,
  })
  profile?: string | null;

  @ApiPropertyOptional({
    example: 'https://bucket.s3.ap-northeast-2.amazonaws.com/1626740269.webp',
    description: 'profile image url',
    required: false,
  })
  picture?: string | null;

  @ApiPropertyOptional({
    example: 'johnDoe',
    description: 'name',
    required: false,
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'johnDoe@gmail.com',
    description: 'email',
    required: false,
  })
  email?: string;

  @ApiPropertyOptional({
    example: 'studentId',
    description: 'student id',
    required: false,
    name: 'student_id',
  })
  @Expose({
    name: 'student_id',
    toPlainOnly: true,
  })
  studentId?: string;

  @ApiPropertyOptional({
    example: '01012345678',
    description: 'phone number',
    required: false,
    name: 'phone_number',
  })
  @Expose({
    name: 'phone_number',
    toPlainOnly: true,
  })
  phoneNumber?: string;
}
