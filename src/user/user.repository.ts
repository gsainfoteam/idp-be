import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserRepository {
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
          error.code === 'P2022'
        ) {
          throw new ForbiddenException('존재하지 않는 유저입니다.');
        }
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
          throw new ConflictException('이미 존재하는 유저입니다.');
        }
        throw new InternalServerErrorException();
      });
  }

  async updateUserPassword(email: string, password: string): Promise<void> {
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
          throw new ForbiddenException('존재하지 않는 유저입니다.');
        }
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
          error.code === 'P2022'
        ) {
          throw new ForbiddenException('존재하지 않는 유저입니다.');
        }
        throw new InternalServerErrorException();
      });
  }
}
