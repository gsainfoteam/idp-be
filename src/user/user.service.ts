import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';
import { SendCertificationCodeDto } from './dto/req/sendCertificationCode.dto';
import { ValidationCertificationCodeDto } from './dto/req/validateCertificatioinCode.dto';
import { RedisNotFoundException } from 'src/redis/exceptions/redisNotFound.exception';
import { ValidateCertificationJwtResDto } from './dto/res/validateCertificationJwtRes.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/req/register.dto';
import { CertificationJwtPayload } from './types/certificationJwtPayload.type';
import { UserRepository } from './user.repository';
import { User } from '@prisma/client';
import { DeleteUserDto } from './dto/req/deleteUser.dto';
import { ChangePasswordDto } from './dto/req/changePassword.dto';

@Injectable()
export class UserService {
  private readonly EmailCertificationCodePrefix = 'email_certification_code_';
  constructor(
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  async sendEmailCertificationCode({
    email,
  }: SendCertificationCodeDto): Promise<void> {
    const emailCertificationCode: string = Math.random()
      .toString(36)
      .substring(2, 12);

    await this.emailService.sendCertificationEmail(
      email,
      emailCertificationCode,
    );

    await this.redisService.set<string>(email, emailCertificationCode, {
      ttl: 3 * 60,
      prefix: this.EmailCertificationCodePrefix,
    });

    return;
  }

  async validateCertificationCode({
    email,
    code,
  }: ValidationCertificationCodeDto): Promise<ValidateCertificationJwtResDto> {
    const certificationCode: string = await this.redisService
      .getOrThrow<string>(email, {
        prefix: this.EmailCertificationCodePrefix,
      })
      .catch((error) => {
        if (error instanceof RedisNotFoundException) {
          throw new ForbiddenException('인증 코드가 만료되었습니다.');
        }
        throw new InternalServerErrorException();
      });
    if (certificationCode !== code) {
      throw new ForbiddenException('인증 코드가 일치하지 않습니다.');
    }
    await this.redisService.del(email, {
      prefix: this.EmailCertificationCodePrefix,
    });
    const payload: CertificationJwtPayload = { sub: email };
    return {
      certificationJwtToken: this.jwtService.sign(payload),
    };
  }

  async register({
    email,
    password,
    name,
    studentId,
    phoneNumber,
    certificationJwt,
  }: RegisterDto): Promise<void> {
    const payload: CertificationJwtPayload = await this.jwtService
      .verifyAsync<CertificationJwtPayload>(certificationJwt, {
        subject: email,
      })
      .catch(() => {
        throw new ForbiddenException('인증 토큰이 만료되었습니다.');
      });

    if (payload.sub !== email) {
      throw new ForbiddenException('인증 토큰이 만료되었습니다.');
    }

    const hashedPassword: string = await bcrypt.hashSync(
      password,
      bcrypt.genSaltSync(10),
    );
    await this.userRepository.createUser({
      email,
      password: hashedPassword,
      name,
      studentId,
      phoneNumber,
    });
  }

  async changePassword({
    email,
    password,
    certificationJwtToken,
  }: ChangePasswordDto): Promise<void> {
    const payload: CertificationJwtPayload = await this.jwtService
      .verifyAsync<CertificationJwtPayload>(certificationJwtToken, {
        subject: email,
      })
      .catch(() => {
        throw new ForbiddenException('인증 토큰이 만료되었습니다.');
      });
    if (payload.sub !== email) {
      throw new ForbiddenException('인증 토큰이 만료되었습니다.');
    }
    const hashedPassword: string = await bcrypt.hashSync(
      password,
      bcrypt.genSaltSync(10),
    );
    await this.userRepository.updateUserPassword(email, hashedPassword);
  }

  async deleteUser({ email, password }: DeleteUserDto): Promise<void> {
    const user: User = await this.userRepository.findUserByEmail(email);
    if (!(await bcrypt.compare(password, user.password))) {
      throw new ForbiddenException('비밀번호가 일치하지 않습니다.');
    }
    await this.userRepository.deleteUser(email);
  }
}
