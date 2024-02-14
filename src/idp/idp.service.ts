import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { RedisService } from 'src/redis/redis.service';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/req/login.dto';
import { LoginResDto } from './dto/res/loginRes.dto';
import { User } from '@prisma/client';

@Injectable()
export class IdpService {
  private readonly refreshTokenPrefix = 'refreshToken';
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly userService: UserService,
  ) {}

  async login({ email, password }: LoginDto): Promise<LoginResDto> {
    const user: User = await this.userService.validateUserPassword({
      email,
      password,
    });
    const refreshToken: string = this.generateOpaqueToken();
    this.redisService.set<Pick<User, 'uuid'>>(
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

  // 유저의 정보와 관련이 없는 토큰을 생성하는 함수
  private generateOpaqueToken() {
    return crypto
      .randomBytes(32)
      .toString('base64')
      .replace(/[+\/=]/g, '');
  }
}
