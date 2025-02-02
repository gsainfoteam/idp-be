import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@lib/logger';
import { UserModule } from './user/user.module';
import { ClientModule } from './client/client.module';
import { HealthModule } from './health/health.module';
import { IdpModule } from './idp/idp.module';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    UserModule,
    ClientModule,
    HealthModule,
    IdpModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
