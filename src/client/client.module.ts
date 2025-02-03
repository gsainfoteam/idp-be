import { PrismaModule } from '@lib/prisma';
import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';

import { ClientController } from './client.controller';
import { ClientRepository } from './client.repository';
import { ClientService } from './client.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ClientController],
  providers: [ClientService, ClientRepository],
  exports: [ClientService],
})
export class ClientModule {}
