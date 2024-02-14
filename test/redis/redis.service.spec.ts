import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';
import { RedisService } from 'src/redis/redis.service';
import { TestConfigModule } from 'test/config/testConfig.module';

describe('RedisSerice', () => {
  let redisService: RedisService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TestConfigModule,
        CacheModule.registerAsync<RedisClientOptions>({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => ({
            store: await redisStore({
              socket: {
                host: configService.get<string>('REDIS_HOST'),
                port: configService.get<number>('REDIS_PORT'),
              },
            }),
          }),
        }),
      ],
      providers: [RedisService],
    }).compile();

    redisService = module.get<RedisService>(RedisService);
  });

  describe('set', () => {
    it('should set a value without error', () => {
      expect(
        redisService.set('1', 'test', { prefix: 'test', ttl: 10 }),
      ).resolves.toBeUndefined();
    });

    it('should set a string value', () => {
      expect(
        redisService.set<string>('1', 'test', { prefix: 'test', ttl: 10 }),
      ).resolves.toBeUndefined();
    });

    it('should set a number value', () => {
      expect(
        redisService.set<number>('1', 1, { prefix: 'test', ttl: 10 }),
      ).resolves.toBeUndefined();
    });

    it('should set a boolean value', () => {
      expect(
        redisService.set<boolean>('1', true, { prefix: 'test', ttl: 10 }),
      ).resolves.toBeUndefined();
    });
  });

  describe('get', () => {
    it('should get a string value without error', () => {
      expect(
        redisService.set<string>('1', 'test', { prefix: 'test', ttl: 1 }),
      ).resolves.toBeUndefined();
      expect(redisService.get<string>('1', { prefix: 'test' })).resolves.toBe(
        'test',
      );
    });

    it('should get a string value without error if the key and value is not set', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(redisService.get<string>('1', { prefix: 'test' })).resolves.toBe(
        undefined,
      );
    });

    it('should get a number value without error', () => {
      expect(
        redisService.set<number>('1', 1, { prefix: 'test', ttl: 1 }),
      ).resolves.toBeUndefined();
      expect(redisService.get<number>('1', { prefix: 'test' })).resolves.toBe(
        1,
      );
    });

    it('should get a number value without error if the key and value is not set', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(redisService.get<number>('1', { prefix: 'test' })).resolves.toBe(
        undefined,
      );
    });

    it('should get a boolean value without error', () => {
      expect(
        redisService.set<boolean>('1', true, { prefix: 'test', ttl: 1 }),
      ).resolves.toBeUndefined();
      expect(redisService.get<boolean>('1', { prefix: 'test' })).resolves.toBe(
        true,
      );
    });

    it('should get a boolean value without error if the key and value is not set', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(redisService.get<boolean>('1', { prefix: 'test' })).resolves.toBe(
        undefined,
      );
    });
  });

  describe('getOrThrow', () => {
    it('should get a string value without error', () => {
      expect(
        redisService.set<string>('1', 'test', { prefix: 'test', ttl: 1 }),
      ).resolves.toBeUndefined();
      expect(
        redisService.getOrThrow<string>('1', { prefix: 'test' }),
      ).resolves.toBe('test');
    });

    it('should throw an error if the key and value is not set', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(
        redisService.getOrThrow<string>('1', { prefix: 'test' }),
      ).rejects.toThrow();
    });

    it('should get a number value without error', () => {
      expect(
        redisService.set<number>('1', 1, { prefix: 'test', ttl: 1 }),
      ).resolves.toBeUndefined();
      expect(
        redisService.getOrThrow<number>('1', { prefix: 'test' }),
      ).resolves.toBe(1);
    });

    it('should throw an error if the key and value is not set', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(
        redisService.getOrThrow<number>('1', { prefix: 'test' }),
      ).rejects.toThrow();
    });

    it('should get a boolean value without error', () => {
      expect(
        redisService.set<boolean>('1', true, { prefix: 'test', ttl: 1 }),
      ).resolves.toBeUndefined();
      expect(
        redisService.getOrThrow<boolean>('1', { prefix: 'test' }),
      ).resolves.toBe(true);
    });

    it('should throw an error if the key and value is not set', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(
        redisService.getOrThrow<boolean>('1', { prefix: 'test' }),
      ).rejects.toThrow();
    });
  });

  describe('del', () => {
    it('should delete a key without error', () => {
      expect(
        redisService.set<string>('1', 'test', { prefix: 'test', ttl: 10 }),
      ).resolves.toBeUndefined();
      expect(redisService.get<string>('1', { prefix: 'test' })).resolves.toBe(
        'test',
      );
      expect(
        redisService.del('1', { prefix: 'test' }),
      ).resolves.toBeUndefined();
      expect(redisService.get<string>('1', { prefix: 'test' })).resolves.toBe(
        undefined,
      );
    });

    it('should delete a key without error if the key is not set', () => {
      expect(
        redisService.del('1', { prefix: 'test' }),
      ).resolves.toBeUndefined();
    });
  });
});
