import { LoggerModule } from '@lib/logger';
import { PrismaModule } from '@lib/prisma';
import { RedisModule } from '@lib/redis';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientModule } from 'src/client/client.module';
import { UserModule } from 'src/user/user.module';

import { BasicAuthGuard } from './guards/basicAuth.guard';
import { OauthController } from './oauth.controller';
import { OauthRepository } from './oauth.repository';
import { OauthService } from './oauth.service';

@Module({
  imports: [
    LoggerModule,
    ConfigModule,
    RedisModule,
    PrismaModule,
    ClientModule,
    UserModule,
  ],
  controllers: [OauthController],
  providers: [OauthService, OauthRepository, BasicAuthGuard],
})
export class OauthModule {}
