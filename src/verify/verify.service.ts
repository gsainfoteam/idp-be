import { AligoService } from '@lib/aligo';
import { Loggable } from '@lib/logger';
import { MailService } from '@lib/mail';
import { CacheNotFoundException, RedisService } from '@lib/redis';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import fs from 'fs';
import Handlebars from 'handlebars';
import juice from 'juice';
import path from 'path';

import {
  SendEmailCodeDto,
  SendPhoneCodeDto,
  VerifyCodeDto,
  VerifyStudentIdDto,
} from './dto/req.dto';
import { VerificationJwtResDto, VerifyStudentIdResDto } from './dto/res.dto';
import { VerificationJwtPayloadType } from './types/verificationJwtPayload.type';

@Loggable()
@Injectable()
export class VerifyService {
  private readonly emailVerificationCodePrefix = 'EmailVerificationCode';
  private readonly logger = new Logger(VerifyService.name);
  private readonly sender =
    this.configService.get<string | undefined>('EMAIL_SENDER') ??
    this.configService.get<string>('EMAIL_USER');
  private readonly template = Handlebars.compile(
    fs.readFileSync(path.join(__dirname, '../templates', 'email.html'), 'utf8'),
  );
  private readonly verifyStudentIdUrl = this.configService.getOrThrow<string>(
    'VERIFY_STUDENT_ID_URL',
  );
  private readonly phoneNumberVerificationCodePrefix =
    'PhoneNumberVerificationCode';

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly aligoService: AligoService,
  ) {}

  /**
   * send the email code to the email address (using node mailer)
   * and save the code to the redis
   * @param param0 it contains email
   * @returns void, but it sends email to the email address
   */
  async sendEmailCode({ email }: SendEmailCodeDto): Promise<void> {
    const emailVerificationCode: string = crypto
      .randomInt(1000000)
      .toString()
      .padStart(6, '0'); // 6 digit int string.

    await this.mailService.sendEmail(
      email,
      `"GIST 메일로 로그인" <${this.sender}>`,
      'GIST 메일로 로그인 인증 코드',
      juice(
        this.template({
          code: emailVerificationCode,
          title: '이메일 인증번호',
          description: `
<span class="orange">GIST 메일로 로그인</span> 서비스의 이메일 인증번호 전송용 메일입니다.<br />
상기 코드를 입력하여 메일을 인증하여 주시기 바랍니다.<br /><br />
<strong>중요:</strong> 이 인증번호는 3분 내에 만료됩니다. 시간 안에 입력해주세요.
`.trim(),
        }),
      ),
    );

    await this.redisService.set<string>(email, emailVerificationCode, {
      ttl: 3 * 60,
      prefix: this.emailVerificationCodePrefix,
    });
  }

  /**
   * validate the code and return the jwt token, to obtain the extendability, it requires hint, depends on hint, 'subject' can be email, phone number, etc.
   * @param param0 it contains code, hint and subject
   * @returns jwt token if the code is valid
   */
  async validateCode({
    subject,
    code,
    hint,
  }: VerifyCodeDto): Promise<VerificationJwtResDto> {
    let prefix: string;
    if (hint === 'email') {
      prefix = this.emailVerificationCodePrefix;
      subject = subject.toLowerCase(); // to lower case
    } else if (hint === 'phoneNumber') {
      prefix = this.phoneNumberVerificationCodePrefix;
    } else {
      throw new BadRequestException('only email and phone number supported');
    }

    const cachedCode = await this.redisService
      .getOrThrow<string>(subject, {
        prefix,
      })
      .catch((error) => {
        if (error instanceof CacheNotFoundException) {
          this.logger.debug(`Redis cache not found with subject: ${subject}`);
          throw new BadRequestException('invalid subject or code');
        }
        this.logger.error(`Redis get error: ${error}`);
        throw new InternalServerErrorException();
      });

    if (
      Buffer.from(code).length !== Buffer.from(cachedCode).length ||
      !crypto.timingSafeEqual(Buffer.from(code), Buffer.from(cachedCode))
    ) {
      this.logger.debug(`code not matched: ${code}`);
      throw new BadRequestException('invalid subject or code');
    }

    await this.redisService.del(subject, {
      prefix,
    });

    const payload: VerificationJwtPayloadType = {
      iss: this.configService.getOrThrow<string>('JWT_ISSUER'),
      sub: subject,
      hint,
    };
    return {
      verificationJwtToken: this.jwtService.sign(payload),
    };
  }

  /**
   * validate the jwt token
   * @param token jwt token
   * @returns payload if the token is valid
   */
  async validateJwtToken(token: string): Promise<VerificationJwtPayloadType> {
    return this.jwtService
      .verifyAsync<VerificationJwtPayloadType>(token, {
        ignoreExpiration: false,
        issuer: this.configService.getOrThrow<string>('JWT_ISSUER'),
      })
      .catch((error) => {
        this.logger.error(`jwt verify error: ${error}`);
        throw new BadRequestException('invalid jwt token');
      });
  }

  async verifyStudentId(
    dto: VerifyStudentIdDto,
  ): Promise<VerifyStudentIdResDto> {
    const studentId = await this.getStudentId(dto);

    const payload: VerificationJwtPayloadType = {
      iss: this.configService.getOrThrow<string>('JWT_ISSUER'),
      sub: studentId,
      hint: 'studentId',
    };
    return {
      studentId,
      verificationJwtToken: this.jwtService.sign(payload),
    };
  }

  async getStudentId({ name, birthDate }: VerifyStudentIdDto): Promise<string> {
    const formData = new URLSearchParams();
    formData.append('name', name);
    formData.append('birth_dt', birthDate);
    formData.append('mode', 'studtNoSearch');
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 60e3);
    const res = await fetch(this.verifyStudentIdUrl, {
      method: 'POST',
      body: formData,
      signal: ac.signal,
    })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') {
          this.logger.debug('timeout error');
          throw new InternalServerErrorException('timeout error');
        }
        this.logger.error(`get student id error: ${error}`);
        throw new InternalServerErrorException();
      })
      .finally(() => clearTimeout(timer));
    if (!res.ok) {
      this.logger.debug(`GIST server error: ${res.status} ${res.statusText}`);
      throw new InternalServerErrorException(
        `GIST server error: ${res.status} ${res.statusText}`,
      );
    }
    const data = (await res.json()) as { result: string; studtNo?: string };
    if (data.result === 'false' || !data.studtNo)
      throw new NotFoundException('Student ID is not found');
    return data.studtNo;
  }

  async sendPhoneCode({ phoneNumber }: SendPhoneCodeDto): Promise<void> {
    const phoneNumberVerificationCode: string = crypto
      .randomInt(1000000)
      .toString()
      .padStart(6, '0');

    const msg = `인포팀 계정 인증코드: [${phoneNumberVerificationCode}] 공유하지 마십시오.`;

    await this.aligoService.sendMessage(phoneNumber, msg);

    await this.redisService.set<string>(
      phoneNumber,
      phoneNumberVerificationCode,
      {
        ttl: 3 * 60,
        prefix: this.phoneNumberVerificationCodePrefix,
      },
    );
  }
}
