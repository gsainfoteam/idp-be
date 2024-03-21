import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
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
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  async sendEmailCertificationCode({
    email,
  }: SendCertificationCodeDto): Promise<void> {
    this.logger.log(`send certification code to ${email}`);
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
    this.logger.log(`validate certification code to ${email}`);
    const certificationCode: string = await this.redisService
      .getOrThrow<string>(email, {
        prefix: this.EmailCertificationCodePrefix,
      })
      .catch((error) => {
        if (error instanceof RedisNotFoundException) {
          this.logger.debug(`Redis key not found: ${email}`);
          throw new ForbiddenException('인증 코드가 만료되었습니다.');
        }
        this.logger.error(`validate certification code error: ${error}`);
        throw new InternalServerErrorException();
      });
    if (certificationCode !== code) {
      this.logger.debug(`certification code not match: ${code}`);
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
    certificationJwtToken,
  }: RegisterDto): Promise<void> {
    this.logger.log(`register user: ${email}`);
    const payload: CertificationJwtPayload = await this.jwtService
      .verifyAsync<CertificationJwtPayload>(certificationJwtToken, {
        subject: email,
      })
      .catch(() => {
        this.logger.debug(
          `certification jwt token out-dated: ${certificationJwtToken}`,
        );
        throw new ForbiddenException('인증 토큰이 만료되었습니다.');
      });

    if (payload.sub !== email) {
      this.logger.debug(
        `certification jwt token not valid: ${certificationJwtToken}`,
      );
      throw new ForbiddenException('인증 토큰이 유효하지 않습니다.');
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
    this.logger.log(`change password: ${email}`);
    const payload: CertificationJwtPayload = await this.jwtService
      .verifyAsync<CertificationJwtPayload>(certificationJwtToken, {
        subject: email,
      })
      .catch(() => {
        this.logger.debug(
          `certification jwt token out-dated: ${certificationJwtToken}`,
        );
        throw new ForbiddenException('인증 토큰이 만료되었습니다.');
      });
    if (payload.sub !== email) {
      this.logger.debug(
        `certification jwt token not valid: ${certificationJwtToken}`,
      );
      throw new ForbiddenException('인증 토큰이 만료되었습니다.');
    }
    const hashedPassword: string = await bcrypt.hashSync(
      password,
      bcrypt.genSaltSync(10),
    );
    await this.userRepository.updateUserPassword(email, hashedPassword);
  }

  async deleteUser({ email, password }: DeleteUserDto): Promise<void> {
    this.logger.log(`delete user: ${email}`);
    await this.validateUserPassword({ email, password });
    await this.userRepository.deleteUser(email);
  }

  async validateUserPassword({
    email,
    password,
  }: Pick<User, 'email' | 'password'>): Promise<User> {
    this.logger.log(`validate user password: ${email}`);
    const user: User = await this.userRepository.findUserByEmail(email);
    if (!(await bcrypt.compare(password, user.password))) {
      throw new ForbiddenException('비밀번호가 일치하지 않습니다.');
    }
    return user;
  }

  async findUserByUuid({
    uuid,
  }: Pick<User, 'uuid'>): Promise<Omit<User, 'password'>> {
    this.logger.log(`find user by uuid: ${uuid}`);
    return this.userRepository.findUserByUuid(uuid);
  }
}
