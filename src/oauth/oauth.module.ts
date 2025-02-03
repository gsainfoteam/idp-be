import { PrismaModule } from '@lib/prisma';
import { RedisModule } from '@lib/redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { AuthModule } from 'src/auth/auth.module';
import { ClientModule } from 'src/client/client.module';
import { UserModule } from 'src/user/user.module';

import { OauthController, OpenIDDiscoveryController } from './oauth.controller';
import { OauthRepository } from './oauth.repository';
import { OauthService } from './oauth.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    ClientModule,
    AuthModule,
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
  providers: [OauthService, OauthRepository],
  controllers: [OauthController, OpenIDDiscoveryController],
})
export class OauthModule {}
