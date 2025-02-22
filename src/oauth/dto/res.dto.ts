import { ApiProperty } from '@nestjs/swagger';
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
  })
  accessToken: string;

  @ApiProperty({
    example: 'Bearer',
    description: 'token type',
    name: 'token_type',
  })
  @Expose({
    name: 'token_type',
  })
  tokenType: string;

  @ApiProperty({
    example: 3600,
    description: 'expires in',
    name: 'expires_in',
  })
  @Expose({
    name: 'expires_in',
  })
  expiresIn: number;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV9',
    description: 'refresh token',
    name: 'refresh_token',
  })
  @Expose({
    name: 'refresh_token',
  })
  refreshToken?: string;

  @ApiProperty({
    example: '84000',
    description: 'refresh token expires in',
    name: 'refresh_token_expires_in',
  })
  @Expose({
    name: 'refresh_token_expires_in',
  })
  refreshTokenExpiresIn?: number;

  @ApiProperty({
    example: 'ey...',
    description: 'id token',
    name: 'id_token',
  })
  @Expose({
    name: 'id_token',
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

  @ApiProperty({
    example: 'https://example.com/profile',
    description: 'profile image url',
    required: false,
  })
  profile?: string | null;

  @ApiProperty({
    example: 'johnDoe',
    description: 'name',
    required: false,
  })
  name?: string;

  @ApiProperty({
    example: 'johnDoe@gmail.com',
    description: 'email',
    required: false,
  })
  email?: string;

  @ApiProperty({
    example: 'studentId',
    description: 'student id',
    required: false,
    name: 'student_id',
  })
  @Expose({
    name: 'student_id',
  })
  studentId?: string;

  @ApiProperty({
    example: '01012345678',
    description: 'phone number',
    required: false,
    name: 'phone_number',
  })
  @Expose({
    name: 'phone_number',
  })
  phoneNumber?: string;
}
