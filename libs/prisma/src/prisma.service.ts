import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

/**
 * Service for using Prisma.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * To set the location of the database, prisma: datasources is used.
   */
  constructor(readonly configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
    });
  }

  /**
   * This method is called when the application is on the bootstrap phase.
   * And it's the right place to connect to the database.
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * This method is called when the application is shutting down.
   * And it's the right place to close the database connection.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
