import { Module } from '@nestjs/common';
import { IdpController } from './idp.controller';
import { IdpService } from './idp.service';
import { IdpRepository } from './idp.repository';

@Module({
  controllers: [IdpController],
  providers: [IdpService, IdpRepository],
})
export class IdpModule {}
