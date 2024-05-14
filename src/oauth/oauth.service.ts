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

  /**
   * it returns certificate for jwt
   * @returns certificate for jwt
   */
  certs(): object {
    this.logger.log('certs');
    return {
      keys: [this.cert()],
    };
  }

  /**
   * it returns code or access token or id token it depends on the response type
   * @param param0 the information for authorization
   * @param userInfo user information
   * @returns the result of authorization
   */
  async authorize(
    { clientId, redirectUri, nonce, scope, responseType }: AuthorizeDto,
    userInfo: UserInfo,
  ): Promise<AuthorizeResType> {
    this.logger.log('authorize');

    // if the client is not valid, it throws an error
    if (!(await this.clientService.validateUri(clientId, redirectUri))) {
      throw new UnauthorizedException('unauthorized_client');
    }

    // if the code is included in the response type, it generates the code
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

    // if the response type includes token or id_token, it generates the token
    if (responseType.includes('token') || responseType.includes('id_token')) {
      // if the nonce is not included in the response type, it throws an error
      if (
        (responseType.includes('id_token') && !nonce) ||
        (!responseType.includes('id_token') && nonce)
      ) {
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

    // if the response type only have code, it returns the code
    return {
      code,
    };
  }

  /**
   * it returns access token or refresh token, it does not return id token
   * @param param0 the information for generating token
   * @param client the client information
   * @returns generated token
   */
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

  /**
   * revokes the token
   * @param param0 the information for revoking token
   * @param client client information
   * @returns void revokes the token
   */
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

  /**
   * validate the token and returns the user information
   * @param token the token that will be validated
   * @returns return the user information
   */
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
    const jwt: JwtPayload = await this.jwtService
      .verifyAsync(token)
      .catch(() => {
        this.logger.error('invalid_token');
        throw new UnauthorizedException('invalid_token');
      });
    return {
      uuid: jwt.sub,
      name: jwt.name,
      email: jwt.email,
      phoneNumber: jwt.phone_number,
      studentId: jwt.studentId,

      ...{
        user_uuid: jwt.sub,
        user_name: jwt.name,
        user_email_id: jwt.email,
        user_phone_number: jwt.phone_number,
        student_id: jwt.studentId,
      },
    };
  }

  /**
   * create tokens from the options
   * @param param0 the information for creating token
   * @returns created tokens
   */
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

    // make user's consent log
    await this.oauthRepository.updateUserConsent(
      user,
      scope.filter((s) =>
        (scopesRequireConsent as Readonly<string[]>).includes(s),
      ),
      clientId,
    );

    return {
      code,
      // if excludeAccessToken is true, it does not include access token
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

      // if excludeScope is true, it does not include scope
      scope: excludeScope ? undefined : scope.join(' '),

      // if excludeIdToken is true, it does not include id token
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

      // if includeRefreshToken is true, it includes refresh token
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

  /**
   * generate access token
   * @param code the code that will be used to generate access token
   * @param redirectUri client's redirect uri
   * @param clientId client's id
   * @returns access token
   */
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
      excludeIdToken: !codeCache.scope.includes('openid'),
      includeRefreshToken: codeCache.scope.includes('offline_access'),
    });
  }

  /**
   * returns the certificate for jwt
   * @param token the token that will be revoked
   * @param clientId client's id
   * @returns whether the token is revoked or not
   */
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

  /**
   * generate certificate for jwt
   * @returns certificate for jwt
   */
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

  /**
   * filter user information that will be included in the token
   * @param user entire user information
   * @param scopes scopes that will be included in the token
   * @returns filtered user information
   */
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

  /**
   * generate opaque token that does not have any meaning
   * @returns opaque token
   */
  private generateOpaqueToken(): string {
    return crypto
      .randomBytes(32)
      .toString('base64')
      .replace(/[+\/=]/g, '');
  }

  /**
   * generate openid connect discovery
   * @returns openid connect discovery
   */
  discovery(): object {
    const baseUrl: string = this.configService.getOrThrow<string>('BASE_URL');
    const issuer = baseUrl.replace('api.', '');
    return {
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
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
