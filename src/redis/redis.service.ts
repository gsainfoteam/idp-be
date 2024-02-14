import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { RedisConfig } from './types/redisConfig.type';
import { RedisNotFoundException } from './exceptions/redisNotFound.exception';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async set<T>(
    key: string,
    value: T,
    { prefix = 'default', ttl }: RedisConfig,
  ): Promise<void> {
    this.logger.log(`set redis key: ${prefix}_${key}`);
    return this.cache.set(`${prefix}_${key}`, value, ttl * 1000);
  }

  async get<T>(
    key: string,
    { prefix = 'default' }: Pick<RedisConfig, 'prefix'>,
  ): Promise<T | undefined> {
    this.logger.log(`get redis key: ${prefix}_${key}`);
    return this.cache.get<T>(`${prefix}_${key}`);
  }

  async getOrThrow<T>(
    key: string,
    { prefix = 'default' }: Pick<RedisConfig, 'prefix'>,
  ): Promise<T> {
    const result = await this.get<T>(key, { prefix });
    if (!result) {
      this.logger.debug(`Redis key not found: ${prefix}_${key}`);
      throw new RedisNotFoundException(`${prefix}_${key}`);
    }
    return result;
  }

  async del(
    key: string,
    { prefix = 'default' }: Pick<RedisConfig, 'prefix'>,
  ): Promise<void> {
    this.logger.log(`del redis key: ${prefix}_${key}`);
    return this.cache.del(`${prefix}_${key}`);
  }
}
