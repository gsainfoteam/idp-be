import { Loggable } from '@lib/logger';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { MailService } from '@lib/mail';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import * as bcrypt from 'bcryptjs';
import { SendCertificationCodeDto } from './dto/req/sendCertificationCode.dto';
import { CertificationCodeEnum } from './types/certificationCode.type';
import { ValidationCertificationCodeDto } from './dto/req/validateCertificationCode.dto';
import { ValidateCertificationJwtResDto } from './dto/res/validateCertificationJwtRes.dto';
import { CertificationJwtPayload } from './types/certificationJwtPayload.type';
import { RegisterDto } from './dto/req/register.dto';
import { ChangePasswordDto } from './dto/req/changePassword.dto';
import { DeleteUserDto } from './dto/req/deleteUser.dto';
import { User } from '@prisma/client';

@Loggable()
@Injectable()
export class UserService {
  private readonly emailCertificationCodePrefix = 'email_certification_code:';
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheService: Cache,
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
      throw new ConflictException('user already exists');
    }
    if (!user && type === CertificationCodeEnum.PASSWORD) {
      this.logger.debug(`user not found: ${email}`);
      throw new ForbiddenException('user not found');
    }

    const emailCertificationCode: string = Math.random()
      .toString(36)
      .substring(2, 12);

    await this.mailService.sendCertificationEmail(
      email,
      emailCertificationCode,
    );

    await this.cacheService.set(
      `${this.emailCertificationCodePrefix}${email}`,
      emailCertificationCode,
      3 * 60 * 1000,
    );
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
      .get<string>(`${this.emailCertificationCodePrefix}${email}`)
      .then((value) => {
        if (value === null) {
          this.logger.debug(`Redis key not found: ${email}`);
          throw new ForbiddenException('certification code out-dated');
        }
        return value;
      });

    if (certificationCode !== code) {
      this.logger.debug(`certification code not match: ${code}`);
      throw new ForbiddenException('certification code not match');
    }
    await this.cacheService.del(`${this.emailCertificationCodePrefix}${email}`);
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
        throw new ForbiddenException('certification jwt token out-dated');
      });

    if (payload.sub !== email) {
      this.logger.debug(
        `certification jwt token not valid: ${certificationJwtToken}`,
      );
      throw new ForbiddenException('certification jwt token not valid');
    }

    const hashedPassword: string = bcrypt.hashSync(
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
        throw new ForbiddenException('certification jwt token out-dated');
      });
    if (payload.sub !== email) {
      this.logger.debug(
        `certification jwt token not valid: ${certificationJwtToken}`,
      );
      throw new ForbiddenException('certification jwt token not valid');
    }
    const hashedPassword: string = bcrypt.hashSync(
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
      throw new ForbiddenException('password not match');
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
