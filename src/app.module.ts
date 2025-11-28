import { LoggerModule } from '@lib/logger';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ClientModule } from './client/client.module';
import { HealthModule } from './health/health.module';
import { OauthModule } from './oauth/oauth.module';
import { UserModule } from './user/user.module';
import { VerifyModule } from './verify/verify.module';
import { WellKnownModule } from './well-known/well-known.module';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    HealthModule,
    UserModule,
    AuthModule,
    ClientModule,
    OauthModule,
    WellKnownModule,
    VerifyModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.getOrThrow<number>('THROTTLER_TTL'),
          limit: configService.getOrThrow<number>('THROTTLER_LIMIT'),
        },
      ],
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
