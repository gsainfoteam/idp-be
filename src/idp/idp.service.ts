import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/req/login.dto';
import { User } from '@prisma/client';
import { LoginResultType } from './types/loginResult.type';
import { Loggable } from '@lib/logger/decorator/loggable';
import { Cache } from '@nestjs/cache-manager';

@Injectable()
@Loggable()
export class IdpService {
  private readonly logger = new Logger(IdpService.name);
  private readonly refreshTokenPrefix = 'refreshToken';
  constructor(
    private readonly cacheService: Cache,
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
    this.cacheService.set<Pick<User, 'uuid'>>(
      `${this.refreshTokenPrefix}${refreshToken}`,
      {
        uuid: user.uuid,
      },
      60 * 60 * 24 * 30 * 6 * 1000,
    );
    return {
      accessToken: this.jwtService.sign({}, { subject: user.uuid }),
      refreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.cacheService.del(`${this.refreshTokenPrefix}${refreshToken}`);
  }

  async refresh(refreshToken: string): Promise<LoginResultType> {
    if (!refreshToken) throw new UnauthorizedException();
    const user: Pick<User, 'uuid'> = await this.cacheService
      .get<Pick<User, 'uuid'>>(`${this.refreshTokenPrefix}${refreshToken}`)
      .then((user) => {
        if (user === null) {
          throw new UnauthorizedException();
        }
        return user;
      });

    await this.cacheService.del(`${this.refreshTokenPrefix}${refreshToken}`);

    const newRefreshToken: string = this.generateOpaqueToken();
    this.cacheService.set<Pick<User, 'uuid'>>(
      `${this.refreshTokenPrefix}${newRefreshToken}`,
      user,
      60 * 60 * 24 * 30 * 6 * 1000,
    );

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
