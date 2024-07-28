import { Module } from '@nestjs/common';
import { PasskeyController } from './passkey.controller';
import { PasskeyService } from './passkey.service';
import { ConfigModule } from '@nestjs/config';
import { IdpModule } from 'src/idp/idp.module';
import { PasskeyRepository } from './passkey.repository';

@Module({
  imports: [ConfigModule, IdpModule],
  controllers: [PasskeyController],
  providers: [PasskeyService, PasskeyRepository],
})
export class PasskeyModule {}
