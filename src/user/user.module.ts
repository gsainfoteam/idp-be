import { LoggerModule } from '@lib/logger';
import { ObjectModule } from '@lib/object';
import { PrismaModule } from '@lib/prisma';
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
    VerifyModule,
    ConfigModule,
    PrismaModule,
    LoggerModule,
    ObjectModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
