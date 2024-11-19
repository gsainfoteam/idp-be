import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ClientModule } from './client/client.module';
import { IdpModule } from './idp/idp.module';
import { UserModule } from './user/user.module';
import { EmailModule } from './email/email.module';
import { OauthModule } from './oauth/oauth.module';
import { CacheModule } from './cache/cache.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from '@lib/logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    ClientModule,
    IdpModule,
    UserModule,
    EmailModule,
    OauthModule,
    CacheModule,
    HealthModule,
    LoggerModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
