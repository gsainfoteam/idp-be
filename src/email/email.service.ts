import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendCertificationEmail(email: string, code: string): Promise<void> {
    this.logger.log(`send certification email to ${email}`);
    await this.mailerService
      .sendMail({
        to: email,
        from: `"GSA 통합 계정 로그인" <${this.configService.get<string>(
          'EMAIL_USER',
        )}>`, // sender address
        subject: 'Gist Email Verification Code ✔', // Subject line
        html: `verification code is <b>${code}</b>`,
      })
      .catch((error) => {
        this.logger.error(`send certification email error: ${error}`);
        throw error;
      });
  }
}
