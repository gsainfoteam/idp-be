import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST'),
          port: configService.get<number>('EMAIL_PORT'),
          secure: true,
          auth: {
            type: 'oauth2',
            user: configService.get<string>('EMAIL_USER'),
            serviceClient: configService.get<string>('EMAIL_SERVICE_CLIENT'),
            privateKey: configService
              .get<string>('EMAIL_PRIVATE_KEY')
              ?.replace(/\\n/g, '\n'),
            accessUrl: configService.get<string>('EMAIL_ACCESS_URL'),
          },
        },
        defaults: {
          from: `"No Reply" <email address>`,
        },
        tls: {
          rejectUnauthorized: false,
        },
      }),
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
