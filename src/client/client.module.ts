import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { ClientRepository } from './client.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { IdpModule } from 'src/idp/idp.module';
import { ClientStrategy } from './guard/client.strategy';
import { AnonymousStrategy } from './guard/anonymous.strategy';
import { ClientGuard } from './guard/client.guard';
import { ClientOptionalGuard } from './guard/clientOptional.guard';

@Module({
  imports: [PrismaModule, HttpModule, ConfigModule, IdpModule],
  controllers: [ClientController],
  providers: [
    ClientService,
    ClientRepository,
    ClientStrategy,
    AnonymousStrategy,
    ClientGuard,
    ClientOptionalGuard,
  ],
  exports: [ClientService, ClientGuard, ClientOptionalGuard],
})
export class ClientModule {}
