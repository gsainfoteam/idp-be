import { Injectable, Logger } from '@nestjs/common';
import { Passkey } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PasskeyRepository {
  private readonly logger = new Logger(PasskeyRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async createPasskey(): Promise<void> {
    this.logger.log(`create passkey`);
    return;
  }

  async findAllPasskeyByUserId(userId: string): Promise<Passkey[]> {
    this.logger.log(`find all passkey by userId: ${userId}`);
    return this.prismaService.passkey.findMany({
      where: {
        internalUserId: userId,
      },
    });
  }
}
