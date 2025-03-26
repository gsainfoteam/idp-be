import { MailService } from '@lib/mail';
import { Module } from '@nestjs/common';

import { MockMailService } from './mock-mail.service';

@Module({
  providers: [
    {
      provide: MailService,
      useClass: MockMailService,
    },
  ],
  exports: [MailService],
})
export class MockMailModule {}
