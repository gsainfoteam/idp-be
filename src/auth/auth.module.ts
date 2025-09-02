import { LoggerModule } from '@lib/logger';
import { PrismaModule } from '@lib/prisma';
import { RedisModule } from '@lib/redis';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { UserGuard } from './guard/auth.guard';
import { UserStrategy } from './guard/auth.strategy';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    LoggerModule,
    ConfigModule,
    RedisModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRE'),
          algorithm: 'HS256',
          audience: configService.get<string>('JWT_AUDIENCE'),
          issuer: configService.get<string>('JWT_ISSUER'),
        },
      }),
    }),
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, UserStrategy, UserGuard],
  exports: [UserGuard],
})
export class AuthModule {}
