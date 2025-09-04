import { Loggable } from '@lib/logger/decorator/loggable';
import { RedisService } from '@lib/redis';
import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import ms, { StringValue } from 'ms';

import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/req.dto';
import { LoginResultType } from './types/loginResult.type';
import { UserRepository } from 'src/user/user.repository';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/typescript-types';

@Injectable()
@Loggable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTokenExpireTime: number;
  private readonly refreshTokenExpireTime: number;
  private readonly refreshTokenPrefix = 'refreshToken';
  private readonly passkeyPrefix = 'passkey';
  private readonly passkeyRpOrigin: string;
  private readonly passkeyRpId: string;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {
    this.accessTokenExpireTime = ms(
      configService.getOrThrow<string>('JWT_EXPIRE') as StringValue,
    );
    this.refreshTokenExpireTime = ms(
      configService.getOrThrow<string>('REFRESH_TOKEN_EXPIRE') as StringValue,
    );
    this.passkeyRpOrigin =
      this.configService.getOrThrow<string>('PASSKEY_RP_ORIGIN');
    this.passkeyRpId = this.configService.getOrThrow<string>('PASSKEY_RP_ID');
  }

  async login({ email, password }: LoginDto): Promise<LoginResultType> {
    const user = await this.authRepository.findUserByEmail(email);
    if (!bcrypt.compareSync(password, user.password)) {
      this.logger.debug(`password not matched: ${email}`);
      throw new UnauthorizedException();
    }

    const refreshToken: string = this.generateOpaqueToken();
    await this.redisService.set<Pick<User, 'uuid'>>(
      refreshToken,
      {
        uuid: user.uuid,
      },
      {
        prefix: this.refreshTokenPrefix,
        ttl: this.refreshTokenExpireTime,
      },
    );
    return {
      accessToken: this.jwtService.sign({}, { subject: user.uuid }),
      refreshToken,
      accessTokenExpireTime: this.accessTokenExpireTime,
      refreshTokenExpireTime: this.refreshTokenExpireTime,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.redisService.del(refreshToken, {
      prefix: this.refreshTokenPrefix,
    });
  }

  async refresh(refreshToken: string): Promise<LoginResultType> {
    if (!refreshToken) throw new UnauthorizedException();
    const cachedUser: Pick<User, 'uuid'> = await this.redisService
      .getOrThrow<Pick<User, 'uuid'>>(refreshToken, {
        prefix: this.refreshTokenPrefix,
      })
      .catch(() => {
        this.logger.debug(`refreshToken not found: ${refreshToken}`);
        throw new UnauthorizedException();
      });
    const user = await this.authRepository.findUserByUuid(cachedUser.uuid); // for checking user existence

    await this.redisService.del(refreshToken, {
      prefix: this.refreshTokenPrefix,
    });

    const newRefreshToken: string = this.generateOpaqueToken();
    void this.redisService.set<Pick<User, 'uuid'>>(
      newRefreshToken,
      cachedUser,
      {
        prefix: this.refreshTokenPrefix,
        ttl: this.refreshTokenExpireTime,
      },
    );

    return {
      accessToken: this.jwtService.sign({}, { subject: user.uuid }),
      refreshToken: newRefreshToken,
      accessTokenExpireTime: this.accessTokenExpireTime,
      refreshTokenExpireTime: this.refreshTokenExpireTime,
    };
  }

  async findUserByUuid(uuid: string): Promise<User> {
    return this.authRepository.findUserByUuid(uuid);
  }

  async registerOptions(
    email: string,
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const user = await this.userRepository.findUserByEmail(email);

    const options = await generateRegistrationOptions({
      rpName: 'idp',
      rpID: this.passkeyRpId,
      userID: Buffer.from(user.uuid),
      userName: user.name,
      excludeCredentials: user.authenticators.map((auth) => ({
        id: auth.credentialId.toString(),
        type: 'public-key',
      })),
    });

    await this.redisService.set<string>(user.uuid, options.challenge, {
      prefix: this.passkeyPrefix,
      ttl: 10 * 60,
    });

    return options;
  }

  async verifyRegistration(
    email: string,
    response: RegistrationResponseJSON,
  ): Promise<LoginResultType> {
    const user = await this.userRepository.findUserByEmail(email);
    const expectedChallenge = await this.redisService.getOrThrow<string>(
      user.uuid,
      {
        prefix: this.passkeyPrefix,
      },
    );

    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.passkeyRpOrigin,
      expectedRPID: this.passkeyRpId,
    });

    if (!verified || !registrationInfo) {
      throw new UnauthorizedException();
    }

    const { id, publicKey, counter } = registrationInfo.credential;

    await this.authRepository.saveAuthenticator({
      credentialId: id,
      publicKey,
      counter,
      userUuid: user.uuid,
    });

    const refreshToken: string = this.generateOpaqueToken();
    await this.redisService.set<Pick<User, 'uuid'>>(
      refreshToken,
      {
        uuid: user.uuid,
      },
      {
        prefix: this.refreshTokenPrefix,
        ttl: this.refreshTokenExpireTime,
      },
    );
    return {
      accessToken: this.jwtService.sign({}, { subject: user.uuid }),
      refreshToken,
      accessTokenExpireTime: this.accessTokenExpireTime,
      refreshTokenExpireTime: this.refreshTokenExpireTime,
    };
  }

  async authenticateOptions(
    email: string,
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    const user = await this.userRepository.findUserByEmail(email);

    if (!user || user.authenticators.length === 0) {
      throw new NotFoundException();
    }

    const options = await generateAuthenticationOptions({
      rpID: this.passkeyRpId,
      allowCredentials: user.authenticators.map((auth) => ({
        id: Buffer.from(auth.credentialId).toString(),
        type: 'public-key',
      })),
    });

    await this.redisService.set<string>(user.uuid, options.challenge, {
      prefix: this.passkeyPrefix,
      ttl: 10 * 60,
    });

    return options;
  }

  async verifyAuthentication(
    email: string,
    response: AuthenticationResponseJSON,
  ): Promise<LoginResultType> {
    const user = await this.userRepository.findUserByEmail(email);
    if (!user) throw new NotFoundException();

    const expectedChallenge = await this.redisService.getOrThrow<string>(
      user.uuid,
      {
        prefix: this.passkeyPrefix,
      },
    );
    if (!expectedChallenge) throw new UnauthorizedException();

    const authenticator = await this.authRepository.findAuthenticator(
      response.id,
    );

    const { verified, authenticationInfo } = await verifyAuthenticationResponse(
      {
        response,
        expectedChallenge,
        expectedOrigin: this.passkeyRpOrigin,
        expectedRPID: this.passkeyRpId,
        credential: {
          ...authenticator,
          id: authenticator.credentialId.toString(),
        },
        requireUserVerification: true,
      },
    );

    if (!verified) {
      throw new UnauthorizedException();
    }

    await this.authRepository.updatePasskeyCounter(
      authenticator.credentialId,
      authenticationInfo.newCounter,
    );

    const refreshToken: string = this.generateOpaqueToken();
    await this.redisService.set<Pick<User, 'uuid'>>(
      refreshToken,
      {
        uuid: user.uuid,
      },
      {
        prefix: this.refreshTokenPrefix,
        ttl: this.refreshTokenExpireTime,
      },
    );
    return {
      accessToken: this.jwtService.sign({}, { subject: user.uuid }),
      refreshToken,
      accessTokenExpireTime: this.accessTokenExpireTime,
      refreshTokenExpireTime: this.refreshTokenExpireTime,
    };
  }

  /**
   * 유저의 정보와 상관이 없은 토큰을 만들어내는 함수.
   * @returns Opaque token
   */
  private generateOpaqueToken() {
    return crypto
      .randomBytes(32)
      .toString('base64')
      .replace(/[+//=]/g, '');
  }
}
