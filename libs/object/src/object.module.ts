import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ObjectService } from './object.service';

@Module({
  imports: [ConfigModule],
  providers: [ObjectService],
  exports: [ObjectService],
})
export class ObjectModule {}
