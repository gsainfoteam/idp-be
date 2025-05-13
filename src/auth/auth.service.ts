import { Loggable } from '@lib/logger/decorator/loggable';
import { RedisService } from '@lib/redis';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import ms, { StringValue } from 'ms';

import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/req.dto';
import { LoginResultType } from './types/loginResult.type';

@Injectable()
@Loggable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTokenExpireTime: number;
  private readonly refreshTokenExpireTime: number;
  private readonly refreshTokenPrefix = 'refreshToken';
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {
    this.accessTokenExpireTime = ms(
      configService.getOrThrow<string>('JWT_EXPIRE') as StringValue,
    );
    this.refreshTokenExpireTime = ms(
      configService.getOrThrow<string>('REFRESH_TOKEN_EXPIRE') as StringValue,
    );
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
