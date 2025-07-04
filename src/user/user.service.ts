import { Loggable } from '@lib/logger';
import { MailService } from '@lib/mail';
import { ObjectService } from '@lib/object';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { VerificationJwtPayloadType } from 'src/verify/types/verificationJwtPayload.type';
import { VerifyService } from 'src/verify/verify.service';

import {
  ChangePasswordDto,
  DeleteUserReqDto,
  IssuePasswordDto,
  RegisterDto,
} from './dto/req.dto';
import { UpdateUserPictureResDto } from './dto/res.dto';
import { UserConsentType } from './types/userConsent.type';
import { UserRepository } from './user.repository';

@Loggable()
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly sender =
    this.configService.get<string | undefined>('EMAIL_SENDER') ??
    this.configService.get<string>('EMAIL_USER');
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly verifyService: VerifyService,
    private readonly objectService: ObjectService,
  ) {}

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
    studentId,
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
   * issue a new password to the user
   * @param param0 it contains email
   */
  async issuePassword({ email }: IssuePasswordDto): Promise<void> {
    const user = await this.userRepository.findUserByEmail(email);
    const newPassword = crypto.randomBytes(18).toString('base64');
    await this.mailService.sendEmail(
      email,
      `"GIST 메일로 로그인" <${this.sender}>`,
      'GIST 메일로 로그인 비밀번호',
      `변경된 비밀번호는 <b>[${newPassword}]</b> 입니다.`,
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
}
