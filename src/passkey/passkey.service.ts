import { Injectable } from '@nestjs/common';
import { PasskeyRepository } from './passkey.repository';
import { ConfigService } from '@nestjs/config';
import { UserInfo } from 'src/idp/types/userInfo.type';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import {
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
} from '@simplewebauthn/server/script/deps';

// For details, refer to official docs: https://simplewebauthn.dev/docs/packages/server

@Injectable()
export class PasskeyService {
  constructor(
    private readonly passkeyRepository: PasskeyRepository,
    private readonly configService: ConfigService,
  ) {}

  private rp = {
    name: this.configService.getOrThrow<string>('WEB_AUTHN_NAME'),
    id: this.configService.getOrThrow<string>('WEB_AUTHN_ID'),
    origin: this.configService.getOrThrow<string>('WEB_AUTHN_ORIGIN'),
  };

  private filterValidTransports(
    transports: string[],
  ): AuthenticatorTransportFuture[] {
    // 추후 추가될 가능성 있음
    const validTransports: AuthenticatorTransportFuture[] = [
      'ble',
      'cable',
      'hybrid',
      'internal',
      'nfc',
      'smart-card',
      'usb',
    ];

    const result: AuthenticatorTransportFuture[] = [];
    transports.forEach((transport) => {
      if (validTransports.includes(transport as any)) {
        result.push(transport as AuthenticatorTransportFuture);
      }
    });
    return result;
  }

  // private generateRegistrationOptions(user: UserInfo) {

  // }

  async registerPasskey(
    user: UserInfo,
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const userPasskeys = await this.passkeyRepository.findAllPasskeyByUserId(
      user.uuid,
    );

    const options: PublicKeyCredentialCreationOptionsJSON =
      await generateRegistrationOptions({
        rpName: this.rp.name,
        rpID: this.rp.id,
        userName: user.name,
        userDisplayName: user.name,
        attestationType: 'none',
        excludeCredentials: userPasskeys.map((passkey) => ({
          id: passkey.credId,
          transports: this.filterValidTransports(passkey.transports),
        })),
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
          authenticatorAttachment: 'cross-platform',
        },
      });

    return options;
  }
}
