import { Loggable } from '@lib/logger';
import { PrismaService } from '@lib/prisma';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Loggable()
@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByEmail(email: string): Promise<User> {
    return this.prismaService.user
      .findUniqueOrThrow({
        where: {
          email,
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          (error.code === 'P2002' || error.code === 'P2025')
        ) {
          this.logger.debug(`user not found: ${email}`);
          throw new ForbiddenException('존재하지 않는 유저입니다.');
        }
        this.logger.error(`find user by email error: ${error}`);
        throw new InternalServerErrorException();
      });
  }

  async findUserByUuid(uuid: string): Promise<Omit<User, 'password'>> {
    return this.prismaService.user
      .findUniqueOrThrow({
        where: {
          uuid,
        },
        select: {
          uuid: true,
          email: true,
          name: true,
          studentId: true,
          phoneNumber: true,
          accessLevel: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          this.logger.debug(`user not found: ${uuid}`);
          throw new ForbiddenException('존재하지 않는 유저입니다.');
        }
        this.logger.error(`find user by uuid error: ${error}`);
        throw new InternalServerErrorException();
      });
  }

  async createUser({
    email,
    password,
    name,
    studentId,
    phoneNumber,
  }: Omit<
    User,
    'accessLevel' | 'uuid' | 'createdAt' | 'updatedAt'
  >): Promise<void> {
    await this.prismaService.user
      .create({
        data: {
          email,
          password,
          name,
          studentId,
          phoneNumber,
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          this.logger.debug(`user already exists: ${email}`);
          throw new ConflictException('이미 존재하는 유저입니다.');
        }
        this.logger.error(`create user error: ${error}`);
        throw new InternalServerErrorException();
      });
  }

  async updateUserPassword(email: string, password: string): Promise<void> {
    await this.prismaService.user
      .update({
        where: {
          email,
        },
        data: {
          password,
        },
      })
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2025' || error.code === 'P2002') {
            this.logger.debug(`user not found: ${email}`);
            throw new ForbiddenException('존재하지 않는 유저입니다.');
          }
          this.logger.debug(`error occurred: ${error.code}`);
          throw new InternalServerErrorException();
        }
        this.logger.error(`update user password error: ${error}`);
        throw new InternalServerErrorException();
      });
  }

  async deleteUser(email: string): Promise<void> {
    await this.prismaService.user
      .delete({
        where: {
          email,
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          this.logger.debug(`user not found: ${email}`);
          throw new ForbiddenException('존재하지 않는 유저입니다.');
        }
        this.logger.error(`delete user error: ${error}`);
        throw new InternalServerErrorException();
      });
  }
}
