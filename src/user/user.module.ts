import { LoggerModule } from '@lib/logger';
import { MailModule } from '@lib/mail';
import { ObjectModule } from '@lib/object';
import { PrismaModule } from '@lib/prisma';
import { RedisModule } from '@lib/redis';
import { TemplatesModule } from '@lib/templates';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { VerifyModule } from 'src/verify/verify.module';

import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [
    AuthModule,
    MailModule,
    VerifyModule,
    ConfigModule,
    PrismaModule,
    LoggerModule,
    ObjectModule,
    RedisModule,
    TemplatesModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
