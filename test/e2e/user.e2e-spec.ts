import { PrismaService } from '@lib/prisma';
import { RedisService } from '@lib/redis';
import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { TestContainers } from '../setup/singleton';

describe('User & Verification', async () => {
  let app: NestApplication;

  beforeAll(async () => {
    const prismaService = TestContainers.getInstance().prismaService;
    const redisService = TestContainers.getInstance().redisService;

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
      .overrideProvider(RedisService)
      .useValue(redisService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });
});
