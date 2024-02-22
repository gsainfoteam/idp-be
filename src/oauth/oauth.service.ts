import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { OauthRepository } from './oauth.repository';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/redis/redis.service';
import { AuthorizeDto } from './dto/req/authorize.dto';
import { ClientService } from 'src/client/client.service';
import {
  Scope,
  allowedScopes,
  scopesRequireConsent,
} from './types/Scopes.type';
import { AuthorizeResType } from './types/authorizeRes.type';
import { UserInfo } from 'src/idp/types/userInfo.type';
import { CodeCacheType } from './types/codeCache.type';
import { CreateTokenType } from './types/createToken.type';
import { TokenCacheType } from './types/tokenCache.type';
import { UserService } from 'src/user/user.service';
import { TokenDto } from './dto/req/token.dto';
import { Client } from '@prisma/client';
import { RevokeDto } from './dto/req/revoke.dto';
import { JwtPayload } from 'jsonwebtoken';

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);
  private readonly CodePrefix = 'code';
  private readonly TokenPrefix = 'token';
  constructor(
    private readonly oauthRepository: OauthRepository,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly clientService: ClientService,
  ) {}

  certs(): object {
    this.logger.log('certs');
    return {
      keys: [this.cert()],
    };
  }

  async authorize(
    { clientId, redirectUri, nonce, scope, responseType }: AuthorizeDto,
    userInfo: UserInfo,
  ): Promise<AuthorizeResType> {
    this.logger.log('authorize');
    if (!(await this.clientService.validateUri(clientId, redirectUri))) {
      throw new UnauthorizedException('unauthroized_clie');
    }
    const code = responseType.includes('code')
      ? await (async () => {
          const code = this.generateOpaqueToken();
          await this.redisService.set<CodeCacheType>(
            code,
            {
              userUuid: userInfo.uuid,
              clientId,
              nonce,
              redirectUri,
              scope,
            },
            { prefix: this.CodePrefix, ttl: 30 },
          );
          return code;
        })()
      : undefined;

    if (responseType.includes('token') || responseType.includes('id_token')) {
      if (responseType.includes('id_token') && !nonce) {
        throw new BadRequestException('invalid_request');
      }
      if (!responseType.includes('id_token') && nonce) {
        throw new BadRequestException('invalid_request');
      }
      return this.createToken({
        user: userInfo,
        clientId,
        scope,
        nonce,
        excludeAccessToken: !responseType.includes('token'),
        excludeScope:
          !responseType.includes('code') && !responseType.includes('token'),
        excludeIdToken: !responseType.includes('id_token'),
        code,
      });
    }

    return {
      code,
    };
  }

  async token(
    { code, redirectUri, grantType, refreshToken, ...clientInfo }: TokenDto,
    client?: Client,
  ): Promise<AuthorizeResType> {
    this.logger.log('token');
    const clientId = client === undefined ? clientInfo.clientId : client.id;
    if (
      clientInfo.clientId &&
      clientInfo.clientSecret &&
      !(await this.clientService.validateClient(
        clientInfo.clientId,
        clientInfo.clientSecret,
      ))
    )
      throw new UnauthorizedException('unauthorized_client');

    if (grantType === 'authorization_code') {
      if (!code || !redirectUri || !clientId)
        throw new BadRequestException('invalid_request');
      return this.generateAccessToken(code, redirectUri, clientId);
    }

    if (!refreshToken) throw new BadRequestException('invalid_request');
    const refreshTokenFromDB =
      await this.oauthRepository.findRefreshToken(refreshToken);
    if (!clientId) throw new BadRequestException('invalid_request');
    await this.oauthRepository.updateRefreshToken(
      refreshTokenFromDB.consent.user,
      clientId,
      refreshTokenFromDB.token,
      refreshTokenFromDB.scopes as Readonly<Scope[]>,
    );
    return this.createToken({
      scope: refreshTokenFromDB.scopes as Readonly<Scope[]>,
      clientId,
      user: refreshTokenFromDB.consent.user,
      excludeIdToken: true,
    });
  }

  async revoke(
    { token, tokenTypeHint, ...clientInfo }: RevokeDto,
    client?: Client,
  ): Promise<void> {
    this.logger.log('revoke');
    const clientId = client === undefined ? clientInfo.clientId : client.id;
    if (tokenTypeHint === 'access_token') {
      await this.revokeAccessToken(token, clientId);
      return;
    }
    if (tokenTypeHint === 'refresh_token') {
      await this.revokeRefreshToken(token, clientId);
      return;
    }
    if (!(await this.revokeAccessToken(token, clientId))) {
      await this.revokeRefreshToken(token, clientId);
    }
  }

  async validateToken(
    token: string,
  ): Promise<Partial<Omit<UserInfo, 'accessLevel'>>> {
    const tokenCache: TokenCacheType | undefined = await this.redisService.get(
      token,
      {
        prefix: this.TokenPrefix,
      },
    );
    if (tokenCache) {
      const user = await this.userService.findUserByUuid({
        uuid: tokenCache.userUuid,
      });
      return this.filterUserInfo(user, tokenCache.scope);
    }
    const jwt: JwtPayload = this.jwtService.verify(token);
    return {
      uuid: jwt.sub,
      name: jwt.name,
      email: jwt.email,
      phoneNumber: jwt.phone_number,
      studentId: jwt.studentId,
    };
  }

  private async createToken({
    user,
    clientId,
    nonce,
    scope,
    excludeAccessToken,
    excludeScope,
    excludeIdToken,
    includeRefreshToken,
    code,
  }: CreateTokenType): Promise<AuthorizeResType> {
    const filteredUser = this.filterUserInfo(user);
    await this.oauthRepository.updateUserConsent(
      user,
      scope.filter((s) =>
        (scopesRequireConsent as Readonly<string[]>).includes(s),
      ),
      clientId,
    );
    return {
      code,
      ...(excludeAccessToken
        ? {}
        : {
            accessToken: await (async () => {
              const token = this.generateOpaqueToken();
              await this.redisService.set<TokenCacheType>(
                token,
                {
                  userUuid: user.uuid,
                  clientId,
                  scope,
                },
                { prefix: this.TokenPrefix, ttl: 3600 },
              );
              return token;
            })(),
            tokenType: 'Bearer',
            expiresIn: 3600,
          }),
      scope: excludeScope ? undefined : scope.join(' '),
      idToken: excludeIdToken
        ? undefined
        : this.jwtService.sign(
            {
              ...filteredUser,
              nonce,
            },
            {
              subject: user.uuid,
              audience: clientId,
            },
          ),
      refreshToken: includeRefreshToken
        ? await (async () => {
            const token = this.generateOpaqueToken();
            await this.oauthRepository.updateRefreshToken(
              user,
              clientId,
              token,
              scope,
            );
            return token;
          })()
        : undefined,
    };
  }

  private async generateAccessToken(
    code: string,
    redirectUri: string,
    clientId: string,
  ): Promise<AuthorizeResType> {
    const codeCache: CodeCacheType = await this.redisService
      .getOrThrow<CodeCacheType>(code, {
        prefix: this.CodePrefix,
      })
      .catch(() => {
        throw new BadRequestException('invalid_grant');
      });
    if (
      redirectUri !== codeCache.redirectUri ||
      clientId !== codeCache.clientId
    ) {
      throw new BadRequestException('invalid_grant');
    }
    return this.createToken({
      user: await this.userService.findUserByUuid({ uuid: codeCache.userUuid }),
      ...codeCache,
      clientId,
      includeRefreshToken: codeCache.scope.includes('offline_access'),
    });
  }

  private async revokeAccessToken(
    token: string,
    clientId: string,
  ): Promise<boolean> {
    const tokenCache: TokenCacheType | undefined =
      await this.redisService.get<TokenCacheType>(token, {
        prefix: this.TokenPrefix,
      });
    if (!tokenCache) return false;
    if (clientId !== tokenCache.clientId) {
      return false;
    }
    await this.redisService.del(token, {
      prefix: this.TokenPrefix,
    });
    return true;
  }

  private async revokeRefreshToken(
    token: string,
    clientId: string,
  ): Promise<boolean> {
    await this.oauthRepository.deleteRefreshToken(token, clientId);
    return true;
  }

  private cert(): object {
    const sk = crypto.createPrivateKey(
      this.configService
        .getOrThrow<string>('JWT_PRIVATE_KEY')
        .replace(/\\n/g, '\n'),
    );
    const pk = crypto.createPublicKey(sk);
    const kid = (() => {
      const shasum = crypto.createHash('sha1');
      shasum.update(pk.export({ format: 'der', type: 'spki' }));
      return shasum.digest('hex');
    })();
    return {
      ...pk.export({ format: 'jwk' }),
      kid,
      use: 'sig',
      alg: 'ES256',
    };
  }

  private filterUserInfo(
    user: UserInfo,
    scopes: Readonly<Scope[]> = allowedScopes,
  ): Partial<UserInfo> {
    return {
      uuid: user.uuid,
      email: scopes.includes('email') ? user.email : undefined,
      name: scopes.includes('profile') ? user.name : undefined,
      studentId: scopes.includes('student_id') ? user.studentId : undefined,
      phoneNumber: scopes.includes('phone') ? user.phoneNumber : undefined,
    };
  }

  private generateOpaqueToken(): string {
    return crypto
      .randomBytes(32)
      .toString('base64')
      .replace(/[+\/=]/g, '');
  }

  discovery(): object {
    const baseUrl: string = this.configService.getOrThrow<string>('BASE_URL');
    return {
      issuer: 'https://idp.gistory.me',
      authorization_endpoint: `${baseUrl}/oauth/authorize`,
      token_endpoint: `${baseUrl}/oauth/token`,
      userinfo_endpoint: `${baseUrl}/oauth/userinfo`,
      jwks_uri: `${baseUrl}/oauth/certs`,
      response_types_supported: [
        'code',
        'token',
        'id_token',
        'code token',
        'code id_token',
        'token id_token',
        'code token id_token',
      ],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['ES256'],
      scopes_supported: allowedScopes,
      token_endpoint_auth_methods_supported: [
        'client_secret_basic',
        'client_secret_post',
      ],
      claims_supported: [
        'name',
        'email',
        'phone_number',
        'student_id',
        'aud',
        'exp',
        'iat',
        'iss',
        'sub',
      ],
      grant_types_supported: [
        'authorization_code',
        'refresh_token',
        'implicit',
      ],
    };
  }
}
