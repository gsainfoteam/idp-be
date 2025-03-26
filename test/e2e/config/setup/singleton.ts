import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { StartedRedisContainer } from '@testcontainers/redis';

export class TestContainers {
  private static instance: TestContainers;
  private _postgresContainer: StartedPostgreSqlContainer | null = null;
  private _redisContainer: StartedRedisContainer | null = null;

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

  setPostgresContainer(container: StartedPostgreSqlContainer) {
    this._postgresContainer = container;
  }

  setRedisContainer(container: StartedRedisContainer) {
    this._redisContainer = container;
  }

  async cleanup() {
    if (this._postgresContainer) {
      await this._postgresContainer.stop();
    }
    if (this._redisContainer) {
      await this._redisContainer.stop();
    }
  }
}
