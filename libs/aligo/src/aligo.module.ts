import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AligoService } from './aligo.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [AligoService],
  exports: [AligoService],
})
export class AligoModule {}
