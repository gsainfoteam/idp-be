import { LoggerModule } from '@lib/logger';
import { RedisModule } from '@lib/redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserGuard } from './guard/auth.guard';
import { UserStrategy } from './guard/auth.strategy';

@Module({
  imports: [
    LoggerModule,
    UserModule,
    ConfigModule,
    RedisModule,
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
  ],
  controllers: [AuthController],
  providers: [AuthService, UserStrategy, UserGuard],
  exports: [UserGuard],
})
export class AuthModule {}
