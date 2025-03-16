import { PrismaService } from '@lib/prisma';
import { RedisService } from '@lib/redis';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { StartedRedisContainer } from '@testcontainers/redis';
import { type StartedTestContainer } from 'testcontainers';

import { MailConfig } from '../util/mail';

export class TestContainers {
  private static instance: TestContainers;
  private _postgresContainer: StartedPostgreSqlContainer | null = null;
  private _redisContainer: StartedRedisContainer | null = null;
  private _mailContainer: StartedTestContainer | null = null;
  private _prismaService: PrismaService | null = null;
  private _redisService: RedisService | null = null;
  private _mailConfig: MailConfig | null = null;

  private constructor() {}

  static getInstance(): TestContainers {
    if (!TestContainers.instance) {
      TestContainers.instance = new TestContainers();
    }
    return TestContainers.instance;
  }

  get postgresContainer() {
    if (!this._postgresContainer) {
      throw new Error('PostgresSQL container not initialized');
    }
    return this._postgresContainer;
  }

  get redisContainer() {
    if (!this._redisContainer) {
      throw new Error('Redis container not initialized');
    }
    return this._redisContainer;
  }

  get mailContainer(): StartedTestContainer {
    if (!this._mailContainer) {
      throw new Error('Mail container not initialized');
    }
    return this._mailContainer;
  }

  get mailConfig() {
    if (!this._mailConfig) {
      throw new Error('Mail config not initialized');
    }
    return this._mailConfig;
  }

  get prismaService() {
    if (!this._prismaService) {
      throw new Error('PrismaService not initialized');
    }
    return this._prismaService;
  }

  get redisService() {
    if (!this._redisService) {
      throw new Error('RedisService not initialized');
    }
    return this._redisService;
  }

  setPostgresContainer(container: StartedPostgreSqlContainer) {
    this._postgresContainer = container;
  }

  setRedisContainer(container: StartedRedisContainer) {
    this._redisContainer = container;
  }

  setMailContainer(container: StartedTestContainer, config: MailConfig) {
    this._mailContainer = container;
    this._mailConfig = config;
  }

  setPrismaService(service: PrismaService) {
    this._prismaService = service;
  }

  setRedisService(service: RedisService) {
    this._redisService = service;
  }

  async cleanup() {
    if (this._postgresContainer) {
      await this._postgresContainer.stop();
    }
    if (this._redisContainer) {
      await this._redisContainer.stop();
    }
    if (this._mailContainer) {
      await this._mailContainer.stop();
    }
  }
}
