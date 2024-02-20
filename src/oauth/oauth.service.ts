import { Injectable } from '@nestjs/common';
import { OauthRepository } from './oauth.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class OauthService {
  private readonly CodePrefix = 'code';
  private readonly TokenPrefix = 'token';
  constructor(
    private readonly oauthRepository: OauthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}
}
