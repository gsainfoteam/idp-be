import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ClientModule } from './client/client.module';
import { IdpModule } from './idp/idp.module';
import { UserModule } from './user/user.module';
import { EmailModule } from './email/email.module';
import { RedisModule } from './redis/redis.module';
import { OauthModule } from './oauth/oauth.module';

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
    RedisModule,
    OauthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
