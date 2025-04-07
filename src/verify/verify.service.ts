import { Loggable } from '@lib/logger';
import { MailService } from '@lib/mail';
import { CacheNotFoundException, RedisService } from '@lib/redis';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

import { SendEmailCodeDto, VerifyCodeDto } from './dto/req.dto';
import { VerificationJwtResDto } from './dto/res.dto';
import { VerificationJwtPayloadType } from './types/verificationJwtPayload.type';

@Loggable()
@Injectable()
export class VerifyService {
  private readonly emailVerificationCodePrefix = 'EmailVerificationCode';
  private readonly logger = new Logger(VerifyService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
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
      `"GSA 통합 계정 로그인" <${this.configService.get<string>(
        'EMAIL_USER',
      )}>`,
      'Gist Email Verification Code ✔',
      `verification code is <b>${emailVerificationCode}</b>`,
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
    if (hint !== 'email') {
      throw new BadRequestException('only email supported');
    }

    const CachedCode = await this.redisService
      .getOrThrow<string>(subject, {
        prefix: this.emailVerificationCodePrefix,
      })
      .catch((error) => {
        if (error instanceof CacheNotFoundException) {
          this.logger.debug(`Redis cache not found with code: ${code}`);
          throw new BadRequestException('invalid code');
        }
        this.logger.error(`Redis get error: ${error}`);
        throw new InternalServerErrorException();
      });

    if (!crypto.timingSafeEqual(Buffer.from(code), Buffer.from(CachedCode))) {
      this.logger.debug(`code not matched: ${code}`);
      throw new BadRequestException('invalid code');
    }

    await this.redisService.del(code, {
      prefix: this.emailVerificationCodePrefix,
    });

    const payload: VerificationJwtPayloadType = {
      iss: this.configService.getOrThrow<string>('JWT_ISSUER'),
      sub: subject,
      hint: 'email',
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
}
