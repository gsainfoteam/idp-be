import { LoggerModule } from '@lib/logger';
import { PrismaModule } from '@lib/prisma';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SlackModule } from 'nestjs-slack';
import { AuthModule } from 'src/auth/auth.module';

import { ClientController } from './client.controller';
import { ClientRepository } from './client.repository';
import { ClientService } from './client.service';

@Module({
  imports: [
    LoggerModule,
    PrismaModule,
    AuthModule,
    SlackModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'webhook',
        url: configService.getOrThrow<string>('SLACK_WEBHOOK_URL'),
      }),
    }),
  ],
  controllers: [ClientController],
  providers: [ClientService, ClientRepository],
  exports: [ClientService],
})
export class ClientModule {}
