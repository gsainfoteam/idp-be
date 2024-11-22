import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { SendCertificationCodeDto } from './dto/req/sendCertificationCode.dto';
import { ValidateCertificationJwtResDto } from './dto/res/validateCertificationJwtRes.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/req/register.dto';
import { CertificationJwtPayload } from './types/certificationJwtPayload.type';
import { UserRepository } from './user.repository';
import { User } from '@prisma/client';
import { DeleteUserDto } from './dto/req/deleteUser.dto';
import { ChangePasswordDto } from './dto/req/changePassword.dto';
import { CacheService } from 'src/cache/cache.service';
import { ValidationCertificationCodeDto } from './dto/req/validateCertificationCode.dto';
import { CacheNotFoundException } from 'src/cache/exceptions/cacheNotFound.exception';
import { CertificationCodeEnum } from './types/certificationCode.type';
import { Loggable } from '@lib/logger/decorator/loggable';

@Injectable()
@Loggable()
export class UserService {
  private readonly EmailCertificationCodePrefix = 'email_certification_code_';
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly emailService: EmailService,
    private readonly cacheService: CacheService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * send the email certification code to the email address (using node mailer)
   * and save the certification code to the redis
   * @param param0 it contains email
   * @returns void, but it sends email to the email address
   */
  async sendEmailCertificationCode({
    email,
    type,
  }: SendCertificationCodeDto): Promise<void> {
    const user = await this.userRepository
      .findUserByEmail(email)
      .catch((error) => {
        if (error instanceof ForbiddenException) {
          return;
        }
        this.logger.error(`send email Certification code error: ${error}`);
        throw new InternalServerErrorException();
      });

    if (user && type === CertificationCodeEnum.REGISTER) {
      this.logger.debug(`user already exists: ${email}`);
      throw new ConflictException('이미 존재하는 유저입니다.');
    }
    if (!user && type === CertificationCodeEnum.PASSWORD) {
      this.logger.debug(`user not found: ${email}`);
      throw new ForbiddenException('존재하지 않는 유저입니다.');
    }

    const emailCertificationCode: string = Math.random()
      .toString(36)
      .substring(2, 12);

    await this.emailService.sendCertificationEmail(
      email,
      emailCertificationCode,
    );

    await this.cacheService.set<string>(email, emailCertificationCode, {
      ttl: 3 * 60,
      prefix: this.EmailCertificationCodePrefix,
    });

    return;
  }

  /**
   * validate the certification code (compare user and redis) and return jwt token
   * @param param0 it contains email and code
   * @returns jwt token if the certification code is valid
   */
  async validateCertificationCode({
    email,
    code,
  }: ValidationCertificationCodeDto): Promise<ValidateCertificationJwtResDto> {
    const certificationCode: string = await this.cacheService
      .getOrThrow<string>(email, {
        prefix: this.EmailCertificationCodePrefix,
      })
      .catch((error) => {
        if (error instanceof CacheNotFoundException) {
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
    await this.cacheService.del(email, {
      prefix: this.EmailCertificationCodePrefix,
    });
    const payload: CertificationJwtPayload = { sub: email };
    return {
      certificationJwtToken: this.jwtService.sign(payload),
    };
  }

  /**
   * register the user to the database
   * @param param0 it contains email, password, name, studentId, phoneNumber, certificationJwtToken
   */
  async register({
    email,
    password,
    name,
    studentId,
    phoneNumber,
    certificationJwtToken,
  }: RegisterDto): Promise<void> {
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

  /**
   * change the user password (validate the user from the jwt token that comes from the email)
   * @param param0 it contains email, password, certificationJwtToken
   */
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

  /**
   * delete the user from the database
   * @param param0 it contains email, password
   */
  async deleteUser({ email, password }: DeleteUserDto): Promise<void> {
    await this.validateUserPassword({ email, password });
    await this.userRepository.deleteUser(email);
  }

  /**
   * validate the user password
   * @param param0 it contains email, password
   * @returns user if the password is correct
   */
  async validateUserPassword({
    email,
    password,
  }: Pick<User, 'email' | 'password'>): Promise<User> {
    const user: User = await this.userRepository.findUserByEmail(email);
    if (!(await bcrypt.compare(password, user.password))) {
      throw new ForbiddenException('비밀번호가 일치하지 않습니다.');
    }
    return user;
  }

  /**
   * find the user by email
   * @param param0 it contains email
   * @returns user if the user exists
   */
  async findUserByUuid({
    uuid,
  }: Pick<User, 'uuid'>): Promise<Omit<User, 'password'>> {
    return this.userRepository.findUserByUuid(uuid);
  }
}
