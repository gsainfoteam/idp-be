import { Module } from '@nestjs/common';
import { OauthService } from './oauth.service';
import { OauthController, OpenIDDiscoveryController } from './oauth.controller';
import { OauthRepository } from './oauth.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientModule } from 'src/client/client.module';
import { IdpModule } from 'src/idp/idp.module';
import * as crypto from 'crypto';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { Oauth2Strategy } from './guard/oauth2.strategy';
import { Oauth2Guard } from './guard/oauth2.guard';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    ConfigModule,
    ClientModule,
    IdpModule,
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const sk = crypto.createPrivateKey(
          configService
            .getOrThrow<string>('JWT_PRIVATE_KEY')
            .replace(/\\n/g, '\n'),
        );
        const pk = crypto.createPublicKey(sk);
        const keyid = (() => {
          const shasum = crypto.createHash('sha1');
          shasum.update(pk.export({ type: 'spki', format: 'der' }));
          return shasum.digest('hex');
        })();
        return {
          privateKey: sk,
          publicKey: pk.export({ type: 'spki', format: 'der' }),
          signOptions: {
            expiresIn: configService.getOrThrow<string>('JWT_EXPIRE'),
            algorithm: 'ES256',
            issuer: configService.getOrThrow<string>('JWT_ISSUER'),
            keyid,
          },
        };
      },
    }),
  ],
  providers: [OauthService, OauthRepository, Oauth2Strategy, Oauth2Guard],
  controllers: [OauthController, OpenIDDiscoveryController],
})
export class OauthModule {}
