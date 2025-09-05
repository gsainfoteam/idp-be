import { IsGistEmail } from '@lib/global';
import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
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
  @ApiProperty()
  @IsString()
  clientDataJSON: string;

  @ApiProperty()
  @IsString()
  authenticatorData: string;

  @ApiProperty()
  @IsString()
  signature: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  userHandle?: string | undefined;
}

class CredentialPropDto {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  rk?: boolean | undefined;
}

class ClientExtensionResultDto {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  appid?: boolean | undefined;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CredentialPropDto)
  credProps?: CredentialPropDto | undefined;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  hmacCreateSecret?: boolean | undefined;
}

class AuthenticationResponseDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  rawId: string;

  @ApiProperty()
  @IsString()
  type: 'public-key';

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => AuthenticationResponseObjectDto)
  response: AuthenticationResponseObjectDto;

  @ApiProperty()
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
