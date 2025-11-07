import { Loggable } from '@lib/logger';
import { MailService } from '@lib/mail';
import { ObjectService } from '@lib/object';
import { RedisService } from '@lib/redis';
import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import fs from 'fs';
import Handlebars from 'handlebars';
import juice from 'juice';
import path from 'path';
import { VerifyStudentIdDto } from 'src/verify/dto/req.dto';
import { VerificationJwtPayloadType } from 'src/verify/types/verificationJwtPayload.type';
import { VerifyService } from 'src/verify/verify.service';

import {
  ChangePasswordDto,
  DeleteUserReqDto,
  IssueUserSecretDto,
  RegisterDto,
} from './dto/req.dto';
import { BasicPasskeyDto, UpdateUserPictureResDto } from './dto/res.dto';
import { UserConsentType } from './types/userConsent.type';
import { UserRepository } from './user.repository';

@Loggable()
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly sender =
    this.configService.get<string | undefined>('EMAIL_SENDER') ??
    this.configService.get<string>('EMAIL_USER');
  private readonly template = Handlebars.compile(
    fs.readFileSync(path.join(__dirname, '../templates', 'email.html'), 'utf8'),
  );
  private readonly passkeyPrefix = 'passkeyRegister';
  private readonly passkeyRpOrigin: string;
  private readonly passkeyRpId: string;
  private readonly verifyStudentIdUrl = this.configService.getOrThrow<string>(
    'VERIFY_STUDENT_ID_URL',
  );
  private readonly studentIdVerificationPrefix = 'studentId';

  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly verifyService: VerifyService,
    private readonly objectService: ObjectService,
    private readonly redisService: RedisService,
  ) {
    this.passkeyRpOrigin =
      this.configService.getOrThrow<string>('PASSKEY_RP_ORIGIN');
    this.passkeyRpId = this.configService.getOrThrow<string>('PASSKEY_RP_ID');
  }

  /**
   * find the user by email
   * @param param0 it contains email
   * @returns user if the user exists
   */
  async findUserByUuid({ uuid }: Pick<User, 'uuid'>): Promise<User> {
    const user = await this.userRepository.findUserByUuid(uuid);
    return {
      ...user,
      picture:
        user.picture === null ? null : this.objectService.getUrl(user.picture),
    };
  }

  async checkEmail(email: string): Promise<boolean> {
    return await this.userRepository.checkEmail(email);
  }

  async findUserConsentByUuid({
    uuid,
  }: Pick<User, 'uuid'>): Promise<UserConsentType[]> {
    return this.userRepository.findUserConsentByUuid(uuid);
  }

  /**
   * register the user to the database
   * @param param0 it contains email, password, name, studentId, phoneNumber, verificationJwtToken
   */
  async register({
    email,
    password,
    name,
    studentIdKey,
    phoneNumber,
    verificationJwtToken,
  }: RegisterDto): Promise<void> {
    const payload: VerificationJwtPayloadType =
      await this.verifyService.validateJwtToken(verificationJwtToken);

    if (payload.hint !== 'email') {
      this.logger.debug('verification hint is not email');
      throw new ForbiddenException('verification hint is not email');
    }

    if (payload.sub !== email) {
      this.logger.debug('verification jwt token not valid');
      throw new ForbiddenException('verification jwt token not valid');
    }

    const studentId = await this.redisService.getOrThrow<string>(studentIdKey, {
      prefix: this.studentIdVerificationPrefix,
    });

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

  async verifyStudentId(uuid: string, dto: VerifyStudentIdDto): Promise<void> {
    const studentId = await this.verifyService.getStudentId(dto);
    await this.userRepository.updateStudentId(uuid, studentId);
  }

  /**
   * issue a new password to the user
   * @param param0 it contains email
   */
  async issuePassword({ email }: IssueUserSecretDto): Promise<void> {
    const user = await this.userRepository.findUserByEmail(email);
    const newPassword = crypto.randomBytes(18).toString('base64');
    await this.mailService.sendEmail(
      email,
      `"GIST 메일로 로그인" <${this.sender}>`,
      'GIST 메일로 로그인 비밀번호',
      juice(
        this.template({
          code: newPassword,
          title: '임시 비밀번호',
          description: `
<span class="orange">GIST 메일로 로그인</span> 서비스의 임시 비밀번호 전송용 메일입니다.<br />
상기 임시 비밀번호를 입력하여 로그인을 완료해주세요.<br /><br />
<strong>중요:</strong> 로그인 후 꼭 비밀번호 변경을 하여 임시 비밀번호를 제거하세요.
`.trim(),
        }),
      ),
    );
    await this.userRepository.updateUserPassword(
      user.uuid,
      bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10)),
    );
  }

  /**
   * change the user password (validate the user from the jwt token that comes from the email)
   * @param param0 it contains email, password, verificationJwtToken
   */
  async changePassword(
    { password, oldPassword }: ChangePasswordDto,
    user: User,
  ): Promise<void> {
    if (!bcrypt.compareSync(oldPassword, user.password)) {
      this.logger.debug('old password not valid');
      throw new ForbiddenException('old password not valid');
    }
    const hashedPassword: string = bcrypt.hashSync(
      password,
      bcrypt.genSaltSync(10),
    );
    await this.userRepository.updateUserPassword(user.uuid, hashedPassword);
  }

  /**
   * create presignedUrl for the user profile image and store it to the database
   * @param userUuid user uuid
   * @returns updateUserProfileResDto that contains presignedUrl
   */
  async updateUserPicture(
    length: number,
    userUuid: string,
  ): Promise<UpdateUserPictureResDto> {
    const key = `user/${userUuid}/profile_${crypto.randomBytes(16).toString('base64')}.webp`;
    const presignedUrl = await this.objectService.createPresignedUrl(
      key,
      length,
    );
    await this.userRepository.updateUserPicture(
      this.objectService.getUrl(key),
      userUuid,
    );
    return {
      presignedUrl,
    };
  }

  /**
   * validate user's password and delete user
   * @param userUuid user's uuid
   * @param param1 object that contains password
   */
  async deleteUser(
    userUuid: string,
    { password }: DeleteUserReqDto,
  ): Promise<void> {
    const user = await this.userRepository.findUserByUuid(userUuid);
    if (!bcrypt.compareSync(password, user.password)) {
      throw new ForbiddenException('password is not valid');
    }
    await this.userRepository.deleteUser(userUuid);
  }

  /**
   * validate user and delete user profile image
   * @param userUuid user's uuid
   */
  async deleteUserPicture(userUuid: string): Promise<void> {
    const user = await this.userRepository.findUserByUuid(userUuid);
    if (!user.picture) {
      this.logger.debug('user picture not found');
      return;
    }
    await this.userRepository.deleteUserPicture(userUuid);
    await this.objectService.deleteObject(`user/${userUuid}/profile.webp`);
  }

  async getPasskeyList(userUuid: string): Promise<BasicPasskeyDto[]> {
    return await this.userRepository.getPasskeyList(userUuid);
  }

  async registerOptions(
    email: string,
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const user = await this.userRepository.findUserByEmail(email);

    const options = await generateRegistrationOptions({
      rpName: 'idp',
      rpID: this.passkeyRpId,
      userID: Buffer.from(user.uuid),
      userName: user.name,
      excludeCredentials: user.authenticators.map((auth) => ({
        id: auth.id,
        type: 'public-key',
      })),
    });

    await this.redisService.set<string>(user.uuid, options.challenge, {
      prefix: this.passkeyPrefix,
      ttl: 10 * 60,
    });

    return options;
  }

  async verifyRegistration(
    email: string,
    name: string,
    response: RegistrationResponseJSON,
    icon?: string,
  ): Promise<boolean> {
    const user = await this.userRepository.findUserByEmail(email);
    const expectedChallenge = await this.redisService.getOrThrow<string>(
      user.uuid,
      {
        prefix: this.passkeyPrefix,
      },
    );

    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.passkeyRpOrigin,
      expectedRPID: this.passkeyRpId,
    });

    if (!verified || !registrationInfo) {
      throw new UnauthorizedException();
    }

    await this.redisService.del(user.uuid, { prefix: this.passkeyPrefix });

    const { id, publicKey, counter } = registrationInfo.credential;

    await this.userRepository.saveAuthenticator({
      id,
      name,
      icon,
      publicKey,
      counter,
      userUuid: user.uuid,
    });

    return true;
  }

  async updatePasskey(
    id: string,
    name: string,
    userUuid: string,
  ): Promise<void> {
    const auth = await this.userRepository.getAuthenticator(id);

    if (auth.userUuid !== userUuid) throw new ForbiddenException();

    return await this.userRepository.updatePasskey(id, name);
  }

  async deletePasskey(id: string, userUuid: string): Promise<void> {
    const auth = await this.userRepository.getAuthenticator(id);

    if (auth.userUuid !== userUuid) throw new ForbiddenException();

    return await this.userRepository.deletePasskey(id);
  }
}
