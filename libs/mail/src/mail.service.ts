import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  constructor(private readonly configService: ConfigService) {
    this.transporter = createTransport({
      host: this.configService.getOrThrow<string>('EMAIL_HOST'),
      port: this.configService.getOrThrow<number>('EMAIL_PORT'),
      secure: true,
      auth: {
        type: 'oauth2',
        user: this.configService.getOrThrow<string>('EMAIL_USER'),
        serviceClient: this.configService.getOrThrow<string>(
          'EMAIL_SERVICE_CLIENT',
        ),
        privateKey: this.configService
          .getOrThrow<string>('EMAIL_PRIVATE_KEY')
          .replace(/\\n/g, '\n'),
        accessUrl: this.configService.getOrThrow<string>('EMAIL_ACCESS_URL'),
      },
      from: `"No Reply" <email address>`,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendCertificationEmail(email: string, code: string): Promise<void> {
    this.logger.log(`send certification email to ${email}`);
    await this.transporter
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
