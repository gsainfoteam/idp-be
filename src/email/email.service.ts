import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendCertificationEmail(email: string, code: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      from: `"GSA 통합 계정 로그인" <${this.configService.get<string>(
        'EMAIL_USER',
      )}>`, // sender address
      subject: 'Gist Email Verification Code ✔', // Subject line
      html: `verification code is <b>${code}</b>`,
    });
  }
}
