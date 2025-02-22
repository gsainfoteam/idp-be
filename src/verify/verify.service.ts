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

import { SendEmailCodeDto, VerifyCodeDto } from './dto/req.dto';
import { VerificationJwtResDto } from './dto/res.dto';
import { EmailVerificationCache } from './types/emailVerificationCache.type';
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
    const emailVerificationCode: string = Math.random()
      .toString(36)
      .substring(2, 12);

    await this.mailService.sendEmail(
      email,
      `"GSA 통합 계정 로그인" <${this.configService.get<string>(
        'EMAIL_USER',
      )}>`,
      'Gist Email Verification Code ✔',
      `verification code is <b>${emailVerificationCode}</b>`,
    );

    await this.redisService.set<EmailVerificationCache>(
      email,
      {
        email,
        code: emailVerificationCode,
      },
      {
        ttl: 3 * 60,
        prefix: this.emailVerificationCodePrefix,
      },
    );
  }

  /**
   * validate the code and return the jwt token, to obtain the extendability, it requires hint
   * @param param0 it contains code and hint
   * @returns jwt token if the code is valid
   */
  async validateCode({
    code,
    hint,
  }: VerifyCodeDto): Promise<VerificationJwtResDto> {
    if (hint !== 'email') {
      throw new BadRequestException('only email supported');
    }

    const emailVerificationCache: EmailVerificationCache =
      await this.redisService
        .getOrThrow<EmailVerificationCache>(code, {
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

    if (emailVerificationCache.code !== code) {
      this.logger.debug(`code not matched: ${code}`);
      throw new BadRequestException('invalid code');
    }

    const payload: VerificationJwtPayloadType = {
      iss: this.configService.getOrThrow<string>('JWT_ISSUER'),
      sub: emailVerificationCache.email,
      hint: 'email',
    };
    return {
      VerificationJwtToken: this.jwtService.sign(payload),
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
