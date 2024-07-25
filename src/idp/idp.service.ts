import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/req/login.dto';
import { User } from '@prisma/client';
import { LoginResultType } from './types/loginResult.type';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class IdpService {
  private readonly logger = new Logger(IdpService.name);
  private readonly refreshTokenPrefix = 'refreshToken';
  constructor(
    private readonly cacheService: CacheService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async login({ email, password }: LoginDto): Promise<LoginResultType> {
    this.logger.log(`login: ${email}`);
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
    this.cacheService.set<Pick<User, 'uuid'>>(
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
    this.logger.log(`logout: ${refreshToken}`);
    await this.cacheService.del(refreshToken, {
      prefix: this.refreshTokenPrefix,
    });
  }

  async refresh(refreshToken: string): Promise<LoginResultType> {
    this.logger.log(`refresh: ${refreshToken}`);
    if (!refreshToken) throw new UnauthorizedException();
    const user: Pick<User, 'uuid'> = await this.cacheService
      .getOrThrow<Pick<User, 'uuid'>>(refreshToken, {
        prefix: this.refreshTokenPrefix,
      })
      .catch(() => {
        this.logger.debug(`refreshToken not found: ${refreshToken}`);
        throw new UnauthorizedException();
      });
    await this.cacheService.del(refreshToken, {
      prefix: this.refreshTokenPrefix,
    });

    const newRefreshToken: string = this.generateOpaqueToken();
    this.cacheService.set<Pick<User, 'uuid'>>(newRefreshToken, user, {
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
      .replace(/[+\/=]/g, '');
  }
}
