import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class IdpStrategy extends PassportStrategy(Strategy, 'idp') {
  constructor(
    readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: configService.get('JWT_ISSUER'),
      audience: configService.get('JWT_AUDIENCE'),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate({ sub }: JwtPayload): Promise<Omit<User, 'password'>> {
    if (!sub) throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    return this.userService
      .findUserByUuid({
        uuid: sub,
      })
      .catch(() => {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      });
  }
}
