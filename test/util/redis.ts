import { RedisService } from '@lib/redis';
import { ConfigService } from '@nestjs/config';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';

export const redisTestContainer = async (): Promise<{
  container: StartedRedisContainer;
  service: RedisService;
}> => {
  const redisContainer = await new RedisContainer().start();

  const redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

  const mockConfigService = new ConfigService({
    REDIS_URL: redisUrl,
  });

  const service = new RedisService(mockConfigService);

  return { container: redisContainer, service };
};
