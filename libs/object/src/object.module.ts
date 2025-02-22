import { Module } from '@nestjs/common';

import { ObjectService } from './object.service';

@Module({
  providers: [ObjectService],
  exports: [ObjectService],
})
export class ObjectModule {}
