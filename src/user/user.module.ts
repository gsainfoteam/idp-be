import { MailModule } from '@lib/mail';
import { PrismaModule } from '@lib/prisma';
import { RedisModule } from '@lib/redis';
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
    RedisModule,
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
