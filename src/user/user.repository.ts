import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByEmail(email: string): Promise<User> {
    this.logger.log(`find user by email: ${email}`);
    return this.prismaService.user
      .findUniqueOrThrow({
        where: {
          email,
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2022'
        ) {
          this.logger.debug(`user not found: ${email}`);
          throw new ForbiddenException('존재하지 않는 유저입니다.');
        }
        this.logger.error(`find user by email error: ${error}`);
        throw new InternalServerErrorException();
      });
  }

  async createUser({
    email,
    password,
    name,
    studentId,
    phoneNumber,
  }: Omit<User, 'accessLevel' | 'uuid'>): Promise<void> {
    this.logger.log(`create user: ${email}`);
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
    this.logger.log(`update user password: ${email}`);
    this.prismaService.user
      .update({
        where: {
          email,
        },
        data: {
          password,
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2022'
        ) {
          this.logger.debug(`user not found: ${email}`);
          throw new ForbiddenException('존재하지 않는 유저입니다.');
        }
        this.logger.error(`update user password error: ${error}`);
        throw new InternalServerErrorException();
      });
  }

  async deleteUser(email: string): Promise<void> {
    this.logger.log(`delete user: ${email}`);
    await this.prismaService.user
      .delete({
        where: {
          email,
        },
      })
      .catch((error) => {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2022'
        ) {
          this.logger.debug(`user not found: ${email}`);
          throw new ForbiddenException('존재하지 않는 유저입니다.');
        }
        this.logger.error(`delete user error: ${error}`);
        throw new InternalServerErrorException();
      });
  }
}
