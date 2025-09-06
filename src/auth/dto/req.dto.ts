import { IsGistEmail } from '@lib/global';
import { BadRequestException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'JohbDoe@gm.gist.ac.kr',
    description: '유저의 이메일 주소',
  })
  @IsEmail()
  @IsGistEmail()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    throw new BadRequestException('이메일 형식이 올바르지 않습니다.');
  })
  email: string;

  @ApiProperty({
    example: 'password1234',
    description: '유저의 비밀번호',
  })
  @IsString()
  password: string;
}

export class PasskeyDto {
  @ApiProperty({
    example: 'JohbDoe@gm.gist.ac.kr',
    description: '유저의 이메일 주소',
  })
  @IsEmail()
  @IsGistEmail()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    throw new BadRequestException('이메일 형식이 올바르지 않습니다.');
  })
  email: string;
}

class AuthenticationResponseObjectDto {
  @ApiProperty({ example: 'eyJ0eXBlIjoid2ViYXV0aG...' })
  @IsString()
  clientDataJSON: string;

  @ApiProperty({ example: 'CqSzhuX99amkiIsvM6jWkQ...' })
  @IsString()
  authenticatorData: string;

  @ApiProperty({ example: 'CqSzhuX99amkiIsvM6jWkQ...' })
  @IsString()
  signature: string;

  @ApiProperty({ example: 'CqSzhuX99amkiIsvM6jWkQ...' })
  @IsOptional()
  @IsString()
  userHandle?: string | undefined;
}

class CredentialPropDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  rk?: boolean | undefined;
}

class ClientExtensionResultDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  appid?: boolean | undefined;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CredentialPropDto)
  credProps?: CredentialPropDto | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hmacCreateSecret?: boolean | undefined;
}

class AuthenticationResponseDto {
  @ApiProperty({ example: 'CqSzhuX99amkiIsvM6jWkQ' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'CqSzhuX99amkiIsvM6jWkQ' })
  @IsString()
  rawId: string;

  @ApiProperty({ example: 'public-key' })
  @Equals('public-key')
  type: 'public-key';

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => AuthenticationResponseObjectDto)
  response: AuthenticationResponseObjectDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ClientExtensionResultDto)
  clientExtensionResults: ClientExtensionResultDto;
}

export class VerifyPasskeyAuthenticationDto {
  @ApiProperty({
    example: 'JohbDoe@gm.gist.ac.kr',
    description: '유저의 이메일 주소',
  })
  @IsEmail()
  @IsGistEmail()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    throw new BadRequestException('이메일 형식이 올바르지 않습니다.');
  })
  email: string;

  @ApiProperty({
    description: '유저의 패스키 인증 응답',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => AuthenticationResponseDto)
  authenticationResponse: AuthenticationResponseDto;
}
