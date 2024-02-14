import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { EmailService } from 'src/email/email.service';
import { TestConfigModule } from 'test/config/testConfig.module';

describe('EmailService', () => {
  let emailService: EmailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TestConfigModule,
        MailerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            transport: {
              host: configService.get<string>('EMAIL_HOST'),
              port: configService.get<number>('EMAIL_PORT'),
              secure: false,
              auth: {
                user: configService.get<string>('EMAIL_USER'),
                pass: configService.get<string>('EMAIL_PASSWORD'),
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
    }).compile();

    emailService = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('sendCertificationEmail', () => {
    it('should send a certification email without error', () => {
      expect(
        emailService.sendCertificationEmail(
          configService.getOrThrow<string>('EMAIL_RECIVER'),
          'test',
        ),
      ).resolves.toBeUndefined();
    });
  });
});
