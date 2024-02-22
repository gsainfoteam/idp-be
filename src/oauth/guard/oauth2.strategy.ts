import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-auth-token';
import { OauthService } from '../oauth.service';
import { UserInfo } from 'src/idp/types/userInfo.type';

@Injectable()
export class Oauth2Strategy extends PassportStrategy(Strategy, 'oauth2') {
  constructor(private readonly oauthService: OauthService) {
    super({
      tokenFields: ['access_token'],
      headerFields: ['authorization'],
    });
  }

  async validate(
    token: string,
  ): Promise<Partial<Omit<UserInfo, 'accessLevel'>>> {
    token = token.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Invalid token');
    return this.oauthService.validateToken(token);
  }
}
