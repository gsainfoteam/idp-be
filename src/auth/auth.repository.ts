import { PrismaService } from '@lib/prisma';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByUuid(uuid: string): Promise<User> {
    return this.prismaService.user
      .findUniqueOrThrow({
        where: {
          uuid,
        },
      })
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            this.logger.debug(`user not found: ${uuid}`);
            throw new UnauthorizedException();
          }
          this.logger.error(`prisma error: ${error.message}`);
          throw new InternalServerErrorException();
        }
        this.logger.error(`unknown error: ${error}`);
        throw new InternalServerErrorException();
      });
  }

  async findUserByEmail(
    email: string,
  ): Promise<Pick<User, 'uuid' | 'password'>> {
    return this.prismaService.user
      .findUniqueOrThrow({
        where: {
          email,
        },
        select: {
          uuid: true,
          password: true,
        },
      })
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            this.logger.debug(`user not found: ${email}`);
            throw new UnauthorizedException();
          }
          this.logger.error(`prisma error: ${error.message}`);
          throw new InternalServerErrorException();
        }
        this.logger.error(`unknown error: ${error}`);
        throw new InternalServerErrorException();
      });
  }
}
