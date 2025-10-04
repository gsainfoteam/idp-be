import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@prisma/client';
import {
  AttestationConveyancePreference,
  AuthenticatorAttachment,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/types';
import { Exclude } from 'class-transformer';

import { UserConsentType } from '../types/userConsent.type';

export class UserResDto implements User {
  @ApiProperty({
    example: '홍길동',
    description: '사용자 이름',
  })
  name: string;

  @ApiProperty({
    example: 'uuid',
    description: '사용자 uuid',
  })
  uuid: string;

  @ApiPropertyOptional({
    example: 'https://bucket.s3.ap-northeast-2.amazonaws.com/1626740269.webp',
    description: '프로필 이미지 url',
    type: 'string',
    nullable: true,
  })
  picture: string | null;

  @ApiPropertyOptional({
    example: 'https://idp.gistory.me/profile/name',
    description: '사용자 idp profile url',
    type: 'string',
    nullable: true,
  })
  profile: string | null;

  @ApiProperty({
    example: 'johndoe@gm.gist.ac.kr',
    description: '사용자 이메일',
  })
  email: string;

  @ApiProperty({
    example: '20180000',
    description: '사용자 학번',
  })
  studentId: string;

  @ApiProperty({
    example: '01012345678',
    description: '사용자 전화번호',
  })
  phoneNumber: string;

  @ApiProperty({
    example: '2021-07-20T14:31:09.000Z',
    description: '가입일',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2021-07-20T14:31:09.000Z',
    description: '최근 수정일',
  })
  updatedAt: Date;

  @Exclude()
  password: string;

  constructor(user: User) {
    Object.assign(this, user);
  }
}

export class UpdateUserPictureResDto {
  @ApiProperty({
    example:
      'https://bucket.s3.ap-northeast-2.amazonaws.com/1626740269/profile.webp',
    description: '프로필 이미지 presigned url',
  })
  presignedUrl: string;
}

export class UserConsentClientResDto {
  @ApiProperty({
    example: 'client name',
    description: 'client 이름',
  })
  name: string;

  @ApiProperty({
    example: 'uuid',
    description: 'client uuid',
  })
  uuid: string;

  @ApiProperty({
    example: ['scope1', 'scope2'],
    description: 'client scope',
  })
  scopes: string[];

  @ApiProperty({
    example: ['optionalScope1', 'optionalScope2'],
    description: 'optional scope',
  })
  optionalScopes: string[];
}

export class UserConsentResDto implements UserConsentType {
  @ApiProperty({
    example: UserConsentClientResDto,
    description: 'client information',
    type: UserConsentClientResDto,
  })
  client: UserConsentClientResDto;

  @ApiProperty({
    example: 'uuid',
    description: 'client Uuid',
  })
  clientUuid: string;

  @ApiProperty({
    example: ['scope1', 'scope2'],
    description: 'consent scope',
  })
  scopes: string[];

  @ApiProperty({
    example: '2021-07-20T14:31:09.000Z',
    description: 'the time when the consent was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2021-07-20T14:31:09.000Z',
    description: 'the time when the consent was updated',
  })
  updatedAt: Date;

  @Exclude()
  userUuid: string;

  constructor(consent: UserConsentType) {
    Object.assign(this, consent);
  }
}

export class UserConsentListResDto {
  @ApiProperty({
    example: [UserConsentResDto],
    description: 'consent list',
    type: [UserConsentResDto],
  })
  list: UserConsentResDto[];
}

class ExcludeCredentialDto {
  @ApiProperty({
    description: 'CredentialID of passkey (Base64URL)',
    example: 'aUF_gprsh...',
  })
  id: string;

  @ApiProperty({
    description: 'Credential type',
    example: 'public-key',
    enum: ['public-key'],
  })
  type: 'public-key';

  @ApiPropertyOptional({
    description: 'List of communication method',
    example: ['internal'],
    type: [String],
    enum: ['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb'],
  })
  transports?: AuthenticatorTransportFuture[];
}

class AuthenticationExtensionsDto {
  @ApiPropertyOptional({ description: 'appid extension' })
  appid?: string;

  @ApiPropertyOptional({ description: 'credProps extension' })
  credProps?: boolean;

  @ApiPropertyOptional({ description: 'hmacCreateSecret extension' })
  hmacCreateSecret?: boolean;

  @ApiPropertyOptional({ description: 'minPinLength extension' })
  minPinLength?: boolean;
}

class RpDto {
  @ApiPropertyOptional({ description: 'rp id' })
  id?: string;

  @ApiProperty({ description: 'rp name' })
  name: string;
}

class PasskeyUserDto {
  @ApiProperty({ description: 'user id' })
  id: string;

  @ApiProperty({ description: 'user name' })
  name: string;

  @ApiProperty({ description: 'user display' })
  displayName: string;
}

class PubKeyCredParamsDto {
  @ApiProperty({ description: 'public key credential alg' })
  alg: number;

  @ApiProperty({
    description: 'public key credential type',
    enum: ['public-key'],
  })
  type: 'public-key';
}

class AuthSelectionDto {
  @ApiPropertyOptional({
    description: 'authenticator attachment',
    enum: ['cross-platform', 'platform'],
  })
  authenticatorAttachment?: AuthenticatorAttachment;

  @ApiPropertyOptional({ description: 'require resident key' })
  requireResidentKey?: boolean;

  @ApiPropertyOptional({
    description: 'resident key',
    enum: ['required', 'discouraged', 'preferred'],
  })
  residentKey?: 'required' | 'discouraged' | 'preferred';

  @ApiPropertyOptional({
    description: 'user verification',
    enum: ['required', 'discouraged', 'preferred'],
  })
  userVerification?: 'required' | 'discouraged' | 'preferred';
}

export class PasskeyRegisterOptionResDto {
  @ApiProperty({
    description: 'challenge (Base64URL)',
    example: 'HPv7vydo...',
  })
  challenge: string;

  @ApiPropertyOptional({ description: 'request timeout(ms)', example: 60000 })
  timeout?: number;

  @ApiProperty({
    example: RpDto,
    description: 'Relying Party',
  })
  rp: RpDto;

  @ApiProperty({
    example: PasskeyUserDto,
    description: 'Passkey user',
  })
  user: PasskeyUserDto;

  @ApiProperty({
    example: [PubKeyCredParamsDto],
    description: 'public key credential parameters',
    type: [PubKeyCredParamsDto],
  })
  pubKeyCredParams: PubKeyCredParamsDto[];

  @ApiPropertyOptional({
    example: [ExcludeCredentialDto],
    description: 'exclude credential list',
    type: [ExcludeCredentialDto],
  })
  excludeCredentials?: ExcludeCredentialDto[];

  @ApiPropertyOptional({
    example: AuthSelectionDto,
    description: 'authenticator selection',
  })
  authenticatorSelection?: AuthSelectionDto;

  @ApiPropertyOptional({
    description: 'attenstaion',
    example: 'none',
    enum: ['none', 'direct', 'enterprise', 'indirect'],
  })
  attestation?: AttestationConveyancePreference;

  @ApiPropertyOptional({
    example: AuthenticationExtensionsDto,
    description: 'WebAuthn extensions',
  })
  extensions?: AuthenticationExtensionsDto;
}

export class BasicPasskeyDto {
  @ApiProperty({
    example: 'ff0e6d1b-c2a4-44fb-aa0e-c20b6a721741',
    description: 'Passkey id',
  })
  id: string;

  @ApiProperty({
    example: 'passkey-name',
    description: 'Passkey name',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'passkey icon url',
    description: 'Passkey icon url',
    type: String,
  })
  icon: string | null;

  @ApiProperty({
    example: '2025-01-01T00:00:00.000Z',
    description: 'Date the passkey was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-01-01T00:00:00.000Z',
    description: 'Date the client was logined',
    type: 'string',
    format: 'date-time',
  })
  loginAt: Date | null;
}
