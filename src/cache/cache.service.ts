import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CacheConfig } from './types/cacheConfig.type';
import { CacheNotFoundException } from './exceptions/cacheNotFound.exception';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async set<T>(
    key: string,
    value: T,
    { prefix = 'default', ttl }: CacheConfig,
  ): Promise<void> {
    this.logger.log(`Setting cache for key: ${key}`);
    await this.redis.set(`${prefix}:${key}`, JSON.stringify(value), 'EX', ttl);
  }

  async get<T>(
    key: string,
    { prefix = 'default' }: Pick<CacheConfig, 'prefix'>,
  ): Promise<T> {
    this.logger.log(`Getting cache for key: ${key}`);
    const value = await this.redis.get(`${prefix}:${key}`);
    return value ? JSON.parse(value) : null;
  }

  async getOrThrow<T>(
    key: string,
    { prefix = 'default' }: Pick<CacheConfig, 'prefix'>,
  ): Promise<T> {
    const value = await this.get<T>(key, { prefix });
    if (!value) {
      this.logger.debug(`Cache not found for key: ${key}`);
      throw new CacheNotFoundException(`${prefix}:${key}`);
    }
    return value;
  }

  async del(
    key: string,
    { prefix = 'default' }: Pick<CacheConfig, 'prefix'>,
  ): Promise<void> {
    this.logger.log(`Deleting cache for key: ${key}`);
    await this.redis.del(`${prefix}:${key}`);
  }
}
