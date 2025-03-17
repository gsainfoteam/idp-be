import { ConfigService } from '@nestjs/config';
import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { MockConfigService } from '../util/mock-config.service';

describe('User & Verification', () => {
  let app: NestApplication;

  beforeAll(async () => {
    const configService = new MockConfigService();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(configService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {});
});
