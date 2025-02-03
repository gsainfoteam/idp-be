import { LoggerModule } from '@lib/logger';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { ClientModule } from './client/client.module';
import { HealthModule } from './health/health.module';
import { IdpModule } from './idp/idp.module';
import { OauthModule } from './oauth/oauth.module';
import { UserModule } from './user/user.module';
import { ResourceModule } from './resource/resource.module';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    UserModule,
    ClientModule,
    HealthModule,
    IdpModule,
    OauthModule,
    ResourceModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
