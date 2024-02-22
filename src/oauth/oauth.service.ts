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
    return {
      keys: [this.cert()],
    };
  }

  async authorize(
    { clientId, redirectUri, nonce, scope, responseType }: AuthorizeDto,
    userInfo: UserInfo,
  ): Promise<AuthorizeResType> {
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
