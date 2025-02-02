import { RedisModule } from '@lib/redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';

import { IdpGuard } from './guard/idp.guard';
import { IdpStrategy } from './guard/idp.strategy';
import { IdpController } from './idp.controller';
import { IdpService } from './idp.service';

@Module({
  imports: [
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
  controllers: [IdpController],
  providers: [IdpService, IdpStrategy, IdpGuard],
  exports: [IdpGuard],
})
export class IdpModule {}
