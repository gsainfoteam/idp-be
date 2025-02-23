import { Loggable } from '@lib/logger';
import { ObjectService } from '@lib/object';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { VerificationJwtPayloadType } from 'src/verify/types/verificationJwtPayload.type';
import { VerifyService } from 'src/verify/verify.service';

import {
  ChangePasswordDto,
  DeleteUserReqDto,
  RegisterDto,
} from './dto/req.dto';
import { UpdateUserProfileResDto } from './dto/res.dto';
import { UserConsentType } from './types/userConsent.type';
import { UserRepository } from './user.repository';

@Loggable()
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly verifyService: VerifyService,
    private readonly objectService: ObjectService,
  ) {}

  /**
   * find the user by email
   * @param param0 it contains email
   * @returns user if the user exists
   */
  async findUserByUuid({ uuid }: Pick<User, 'uuid'>): Promise<User> {
    return this.userRepository.findUserByUuid(uuid);
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
      this.logger.debug(
        `verification hint is not email: ${verificationJwtToken}`,
      );
      throw new ForbiddenException('verification hint is not email');
    }

    if (payload.sub !== email) {
      this.logger.debug(
        `certification jwt token not valid: ${verificationJwtToken}`,
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
      profile: null,
      studentId,
      phoneNumber,
    });
  }

  /**
   * change the user password (validate the user from the jwt token that comes from the email)
   * @param param0 it contains email, password, verificationJwtToken
   */
  async changePassword({
    email,
    password,
    verificationJwtToken,
  }: ChangePasswordDto): Promise<void> {
    const payload: VerificationJwtPayloadType =
      await this.verifyService.validateJwtToken(verificationJwtToken);

    if (payload.sub !== email) {
      this.logger.debug(
        `certification jwt token not valid: ${verificationJwtToken}`,
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
   * create presignedUrl for the user profile image and store it to the database
   * @param userUuid user uuid
   * @returns updateUserProfileResDto that contains presignedUrl
   */
  async updateUserProfile(userUuid: string): Promise<UpdateUserProfileResDto> {
    const presignedUrl = await this.objectService.createPresignedUrl(
      `${userUuid}/profile.webp`,
    );
    await this.userRepository.updateUserProfile(presignedUrl, userUuid);
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
}
