import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { WellKnownController } from './well-known.controller';
import { WellKnownService } from './well-known.service';

@Module({
  imports: [ConfigModule],
  controllers: [WellKnownController],
  providers: [WellKnownService],
})
export class WellKnownModule {}
