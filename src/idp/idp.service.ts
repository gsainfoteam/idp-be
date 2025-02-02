import { Loggable } from '@lib/logger/decorator/loggable';
import { RedisService } from '@lib/redis';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as crypto from 'crypto';
import { UserService } from 'src/user/user.service';

import { LoginDto } from './dto/req.dto';
import { LoginResultType } from './types/loginResult.type';

@Injectable()
@Loggable()
export class IdpService {
  private readonly logger = new Logger(IdpService.name);
  private readonly refreshTokenPrefix = 'refreshToken';
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async login({ email, password }: LoginDto): Promise<LoginResultType> {
    const user: User = await this.userService
      .validateUserPassword({
        email,
        password,
      })
      .catch(() => {
        this.logger.debug(`login failed: ${email}`);
        throw new UnauthorizedException();
      });
    const refreshToken: string = this.generateOpaqueToken();
    await this.redisService.set<Pick<User, 'uuid'>>(
      refreshToken,
      {
        uuid: user.uuid,
      },
      {
        prefix: this.refreshTokenPrefix,
        ttl: 60 * 60 * 24 * 30 * 6,
      },
    );
    return {
      accessToken: this.jwtService.sign({}, { subject: user.uuid }),
      refreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.redisService.del(refreshToken, {
      prefix: this.refreshTokenPrefix,
    });
  }

  async refresh(refreshToken: string): Promise<LoginResultType> {
    if (!refreshToken) throw new UnauthorizedException();
    const user: Pick<User, 'uuid'> = await this.redisService
      .getOrThrow<Pick<User, 'uuid'>>(refreshToken, {
        prefix: this.refreshTokenPrefix,
      })
      .catch(() => {
        this.logger.debug(`refreshToken not found: ${refreshToken}`);
        throw new UnauthorizedException();
      });

    await this.redisService.del(refreshToken, {
      prefix: this.refreshTokenPrefix,
    });

    const newRefreshToken: string = this.generateOpaqueToken();
    void this.redisService.set<Pick<User, 'uuid'>>(newRefreshToken, user, {
      prefix: this.refreshTokenPrefix,
      ttl: 60 * 60 * 24 * 30 * 6,
    });

    return {
      accessToken: this.jwtService.sign({}, { subject: user.uuid }),
      refreshToken: newRefreshToken,
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
