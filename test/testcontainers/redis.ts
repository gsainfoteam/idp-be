import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';

export const redisTestContainer = async (): Promise<{
  container: StartedRedisContainer;
}> => {
  const redisContainer = await new RedisContainer().start();

  return { container: redisContainer };
};
