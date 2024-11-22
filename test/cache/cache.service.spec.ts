import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../../src/cache/cache.service';
import { Redis } from 'ioredis';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { CacheNotFoundException } from '../../src/cache/exceptions/cacheNotFound.exception';

jest.setTimeout(30000);
describe('CacheService Integration Test With Redis', () => {
  let service: CacheService;
  let redis: Redis;
  let redisTestContainer: StartedTestContainer;

  beforeAll(async () => {
    //TODO: Need production redis version or docker image version

    redisTestContainer = await new GenericContainer('redis')
      .withExposedPorts(6379)
      .start();

    const host = redisTestContainer.getHost();
    const port = redisTestContainer.getMappedPort(6379);

    redis = new Redis(port, host);

    try {
      const res = await redis.ping();
      console.log('Redis connection established: ', res);
    } catch (err) {
      console.error('Redis connection failed: ', err);
      throw err;
    }
  });

  afterAll(async () => {
    await redis.quit();

    await redisTestContainer.stop();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: redis,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  afterEach(async () => {
    await redis.flushall();
  });

  it('should cacheService establish redis connection', async () => {
    const pingResponse = await redis.ping();
    expect(pingResponse).toBe('PONG');
  });

  it('should set and get a value in cache', async () => {
    const key = 'testKey';
    const value = { message: 'Hello, Redis!' };
    const config = { prefix: 'test', ttl: 10 };

    await service.set(key, value, config);
    const result = await service.get(key, { prefix: 'test' });

    expect(result).toEqual(value);
  });

  it('should throw CacheNotFoundException when key is not found', async () => {
    const key = 'nonexistentKey';

    await expect(service.getOrThrow(key, { prefix: 'test' })).rejects.toThrow(
      CacheNotFoundException,
    );
  });

  it('should delete a value from cache', async () => {
    const key = 'deleteKey';
    const value = { message: 'Delete this!' };
    const config = { prefix: 'test', ttl: 10 };

    await service.set(key, value, config);
    await service.del(key, { prefix: 'test' });

    const result = await service.get(key, { prefix: 'test' });
    expect(result).toBeNull();
  });
});
