import { RedisService } from '@lib/redis';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ClientService } from 'src/client/client.service';

import {
  AuthorizationReqDto,
  ConsentReqDto,
  RevokeReqDto,
} from './dto/req.dto';
import { TokenResDto } from './dto/res.dto';
import { OauthAuthorizeException } from './exceptions/oauth.authorize.exception';
import { OauthTokenException } from './exceptions/oauth.token.exception';
import { OauthRepository } from './oauth.repository';
import { AuthorizeCacheType } from './types/authorizeCache.type';
import {
  ClientCredentialsGrantContentType,
  CodeGrantContentType,
  GrantContentType,
  RefreshTokenGrantContentType,
} from './types/grant.type';
import { TokenScopeList } from './types/scope.type';
import { TokenCacheType } from './types/tokenCache.type';

@Injectable()
export class OauthService {
  private readonly CodePrefix = 'code';
  private readonly TokenPrefix = 'token';
  constructor(
    private readonly oauthRepository: OauthRepository,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly clientService: ClientService,
  ) {}

  /**
   * make the user consent to the client. through this endpoint, the user can agree to use the client.
   * @param param0 consent request dto
   * @param user user from the request
   */
  async consent(
    { scope, client_id }: ConsentReqDto,
    user: User,
  ): Promise<void> {
    // check if the scopes are valid
    scope.forEach((s) => {
      if (!TokenScopeList.includes(s)) {
        throw new OauthAuthorizeException('invalid_scope');
      }
    });
    // upsert the consent
    await this.oauthRepository.upsertConsent(user.uuid, client_id, scope);
  }

  /**
   * it makes the authorization code and save it to redis since we use oauth2.1, we need to save the code_challenge and code_challenge_method
   * @param authorizeReqDto
   * @param user since this endpoint is requested by the idp fe, we can get the user from the request.
   * @returns redirect_uri with query parameters
   */
  async authorize(
    {
      client_id,
      code_challenge,
      code_challenge_method,
      redirect_uri,
      scope,
      state,
    }: AuthorizationReqDto,
    user: User,
  ): Promise<string> {
    // recommend: integrate the query below two lines.
    const client = await this.clientService
      .getClientByUuid(client_id)
      .catch(() => {
        throw new OauthAuthorizeException('unauthorized_client');
      });
    const consent = await this.oauthRepository.findConsent(
      user.uuid,
      client_id,
    );

    // check if the client has the scope
    scope.forEach((s) => {
      if (!consent.scopes.includes(s) || !TokenScopeList.includes(s)) {
        throw new OauthAuthorizeException('invalid_scope');
      }
    });
    // check if the redirect_uri is in the client's urls
    if (!client.urls.includes(redirect_uri)) {
      throw new OauthAuthorizeException('access_denied');
    }
    // check if the id token is supported
    if (scope.includes('openid')) {
      if (!client.idTokenAllowed) {
        throw new OauthAuthorizeException('invalid_scope');
      }
    }

    const code = this.generateOpaqueToken();
    await this.redisService.set<AuthorizeCacheType>(
      code,
      {
        clientId: client_id,
        UserUuid: user.uuid,
        codeChallenge: code_challenge,
        codeChallengeMethod: code_challenge_method,
        redirectUri: redirect_uri,
        scope,
      },
      {
        prefix: this.CodePrefix,
        ttl: 10 * 60, // 10 minutes
      },
    );

    return `${redirect_uri}?code=${code}&state=${state}&iss=${this.configService.getOrThrow<string>('JWT_ISSUER')}`;
  }

  /**
   * get the token from the request and their return will be different by the grant type (authorization_code, refresh_token, client_credentials)
   * @param grantType the grant type and their content of the request
   * @returns the token response dto
   */
  async token(grantType: GrantContentType): Promise<TokenResDto> {
    switch (grantType.grant_type) {
      case 'authorization_code':
        return this.codeGrant(grantType);
      case 'refresh_token':
        return this.refreshTokenGrant(grantType);
      case 'client_credentials':
        return this.clientCredentialsGrant(grantType);
      default:
        throw new OauthTokenException('unsupported_grant_type');
    }
  }

  /**
   * return the token by the code grant
   * @param param0 content of the request
   * @returns tokens
   */
  async codeGrant({
    client_id,
    code,
    code_verifier,
  }: CodeGrantContentType): Promise<TokenResDto> {
    const cache = await this.redisService
      .getOrThrow<AuthorizeCacheType>(code, {
        prefix: this.CodePrefix,
      })
      .catch(() => {
        throw new OauthTokenException('invalid_grant');
      });

    if (cache.clientId !== client_id) {
      throw new OauthTokenException('invalid_client');
    }
    if (cache.codeChallengeMethod === 'S256') {
      cache.codeChallenge = crypto
        .createHash('sha256')
        .update(code_verifier)
        .digest('base64url');
    }
    if (cache.codeChallenge !== code_verifier) {
      throw new OauthTokenException('invalid_request');
    }

    const accessToken = this.generateOpaqueToken();
    await this.redisService.set<TokenCacheType>(
      accessToken,
      {
        sub: 'user',
        clientId: client_id,
        scope: cache.scope,
      },
      {
        prefix: this.TokenPrefix,
        ttl: 3 * 60 * 60, // 3 hours
      },
    );

    let refreshToken = undefined;
    if (cache.scope.includes('offline_access')) {
      refreshToken = this.generateOpaqueToken();
      await this.oauthRepository.createRefreshToken(
        refreshToken,
        cache.scope,
        cache.UserUuid,
        cache.clientId,
      );
    }

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3 * 60 * 60, // 3 hours
      refresh_token: refreshToken,
      scope: cache.scope,
    } as TokenResDto;
  }

  /**
   * return the token by the refresh token grant
   * @param param0 the content of the request
   * @returns tokens
   */
  async refreshTokenGrant({
    client_id,
    refresh_token,
  }: RefreshTokenGrantContentType): Promise<TokenResDto> {
    if (!refresh_token) {
      throw new OauthTokenException('invalid_request');
    }
    const refreshTokenData =
      await this.oauthRepository.findRefreshTokenByToken(refresh_token);

    if (refreshTokenData.clientUuid !== client_id) {
      throw new OauthTokenException('invalid_grant');
    }

    const accessToken = this.generateOpaqueToken();
    await this.redisService.set<TokenCacheType>(
      accessToken,
      {
        sub: 'user',
        clientId: client_id,
        scope: refreshTokenData.scopes,
      },
      {
        prefix: this.TokenPrefix,
        ttl: 3 * 60 * 60, // 3 hours
      },
    );

    let refreshToken = undefined;
    if (refreshTokenData.scopes.includes('offline_access')) {
      refreshToken = this.generateOpaqueToken();
      await this.oauthRepository.createRefreshToken(
        refreshToken,
        refreshTokenData.scopes,
        refreshTokenData.userUuid,
        refreshTokenData.clientUuid,
      );
    }

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3 * 60 * 60, // 3 hours
      refresh_token: refreshToken,
      scope: refreshTokenData.scopes,
    } as TokenResDto;
  }

  /**
   * revoke the token by the token type hint
   * @param param0 tokens and token type hint
   */
  async revoke({ token, token_type_hint }: RevokeReqDto): Promise<void> {
    if (token_type_hint === 'access_token') {
      await this.redisService.del(token, {
        prefix: this.TokenPrefix,
      });
    } else if (token_type_hint === 'refresh_token') {
      await this.oauthRepository.deleteRefreshTokenByToken(token);
    } else {
      throw new BadRequestException({
        error: 'invalid_request',
      });
    }
  }

  /**
   * return the token by the client credentials grant
   * @param param0 the content of the request
   * @returns tokens
   */
  async clientCredentialsGrant({
    client_id,
    client_secret,
    scope,
  }: ClientCredentialsGrantContentType): Promise<TokenResDto> {
    const client = await this.clientService.getClientByUuid(client_id);

    if (bcrypt.compareSync(client_secret, client.secret)) {
      throw new OauthTokenException('invalid_client');
    }

    const accessToken = this.generateOpaqueToken();
    await this.redisService.set<TokenCacheType>(
      accessToken,
      {
        sub: 'client',
        clientId: client_id,
        scope,
      },
      {
        prefix: this.TokenPrefix,
        ttl: 3 * 30 * 24 * 60 * 60, // 3 months
      },
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3 * 30 * 24 * 60 * 60, // 3 months
      scope,
    } as TokenResDto;
  }

  /**
   * generate opaque token that does not have any meaning
   * @returns opaque token
   */
  private generateOpaqueToken(): string {
    return crypto.randomBytes(32).toString('base64').replace(/[+/=]/g, '');
  }
}
