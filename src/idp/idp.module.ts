import { Module } from '@nestjs/common';
import { IdpController } from './idp.controller';
import { IdpService } from './idp.service';
import { IdpRepository } from './idp.repository';
import { RedisModule } from 'src/redis/redis.module';
import { UserModule } from 'src/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { IdpStrategy } from './guard/idp.strategy';
import { IdpGuard } from './guard/idp.guard';

@Module({
  imports: [
    RedisModule,
    UserModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
          algorithm: 'HS256',
          audience: configService.get<string>('JWT_AUDIENCE'),
          issuer: configService.get<string>('JWT_ISSUER'),
        },
      }),
    }),
  ],
  controllers: [IdpController],
  providers: [IdpService, IdpRepository, IdpStrategy, IdpGuard],
  exports: [IdpGuard],
})
export class IdpModule {}
