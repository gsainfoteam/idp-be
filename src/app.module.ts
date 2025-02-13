import { LoggerModule } from '@lib/logger';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ClientModule } from './client/client.module';
import { HealthModule } from './health/health.module';
import { OauthModule } from './oauth/oauth.module';
import { UserModule } from './user/user.module';
import { UserinfoModule } from './userinfo/userinfo.module';

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
    UserinfoModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
