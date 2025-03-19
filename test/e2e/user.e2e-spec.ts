import { MailModule, MailService } from '@lib/mail';
import { ConfigModule } from '@nestjs/config';
import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { MockConfigModule } from './mock/config/mock-config.module';
import { MockMailModule } from './mock/mail/mock-mail.module';
import { MockMailService } from './mock/mail/mock-mail.service';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

describe('User & Verification', () => {
  let app: NestApplication;
  let httpRequest: any;
  // let configService: ConfigService;
  let mailService: MockMailService;
  const testEmail = 'chungjung@gm.gist.ac.kr';

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(ConfigModule)
      .useModule(MockConfigModule.forRoot())
      .overrideModule(MailModule)
      .useModule(MockMailModule)
      .compile();

    app = moduleFixture.createNestApplication();
    // configService = moduleFixture.get<ConfigService>(ConfigService);
    // // MockMailService를 MailService 타입으로 주입받지만 실제로는 MockMailService 인스턴스입니다
    mailService = moduleFixture.get<MailService>(
      MailService,
    ) as unknown as MockMailService;

    await app.init();
    httpRequest = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('Send verification code to email', async () => {
    // 테스트 시작 전 메일 기록 초기화
    mailService.clearSentEmails();

    await httpRequest
      .post('/verify/email')
      .send({ email: testEmail })
      .expect(201);

    const email = mailService.getLastEmailSentTo(testEmail);
    if (!email) {
      fail('이메일이 전송되지 않았습니다');
      return;
    }

    expect(email.to).toEqual(testEmail);
    expect(email.subject).toContain('Verification Code');

    const content = email.content || fail('이메일 내용이 없습니다');
    const codeRegex = /verification code is <b>([a-zA-Z0-9]+)<\/b>/i;
    const matches = content.match(codeRegex);

    const code = matches ? matches[1] : fail('인증 코드를 찾을 수 없습니다');

    const verifyResponse = await httpRequest
      .post('/verify')
      .send({ subject: testEmail, code, hint: 'email' })
      .expect(201);

    expect(verifyResponse.body).toHaveProperty('verificationJwtToken');
    expect(typeof verifyResponse.body.verificationJwtToken).toBe('string');
  });

  it('Send verification code to email with wrong code', async () => {
    // 잘못된 인증 코드 사용 (같은 길이로 맞춤)
    const wrongCode = '123456abcdef';

    await httpRequest
      .post('/verify')
      .send({
        subject: testEmail,
        code: wrongCode,
        hint: 'email',
      })
      .expect(400);
  });
});
