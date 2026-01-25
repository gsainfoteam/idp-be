import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthenticatorTransportFuture } from '@simplewebauthn/types';

export class LoginResDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX9.eyJzdWIiOiJqb2huZG9lQGdtLmdpc3QuYWMua3IiLCJpYXQiOjE2MzIwNzIwMzYsImV4cCI6MTYzMjA3MjA5Nn0.',
    description: '액세스 토큰',
  })
  accessToken: string;
}

class AllowCredentialDto {
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
    enum: ['internal', 'ble', 'cable', 'hybrid', 'nfc', 'smart-card', 'usb'],
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

export class PasskeyAuthOptionResDto {
  @ApiProperty({
    description: 'uuid for challenge',
    example: 'uuid',
  })
  key: string;

  @ApiProperty({
    description: 'challenge (Base64URL)',
    example: 'HPv7vydo...',
  })
  challenge: string;

  @ApiPropertyOptional({ description: 'request timeout(ms)', example: 60000 })
  timeout?: number;

  @ApiPropertyOptional({
    description: 'Relying Party ID',
    example: 'account.gistory.me',
  })
  rpId?: string;

  @ApiPropertyOptional({
    example: [AllowCredentialDto],
    description: 'Passkey list',
    type: [AllowCredentialDto],
  })
  allowCredentials?: AllowCredentialDto[];

  @ApiPropertyOptional({
    description: 'User verification policy',
    example: 'preferred',
    enum: ['required', 'discouraged', 'preferred'],
  })
  userVerification?: 'required' | 'discouraged' | 'preferred';

  @ApiPropertyOptional({
    example: AuthenticationExtensionsDto,
    description: 'WebAuthn extensions',
  })
  extensions?: AuthenticationExtensionsDto;
}
