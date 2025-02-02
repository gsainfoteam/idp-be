import { createKeyv } from '@keyv/redis';
import { MailModule } from '@lib/mail';
import { PrismaModule } from '@lib/prisma';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    MailModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          stores: [createKeyv(configService.getOrThrow<string>('REDIS_URL'))],
        };
      },
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('CERTIFICATION_JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('CERTIFICATION_JWT_EXPIRE'),
          algorithm: 'HS256',
        },
      }),
    }),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
