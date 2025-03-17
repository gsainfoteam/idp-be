import { psqlTestContainer } from '../../util/testcontainers/database';
import { redisTestContainer } from '../../util/testcontainers/redis';
import { TestContainers } from './singleton';

export default async function globalSetup() {
  const containers = TestContainers.getInstance();

  const { container: postgresContainer } = await psqlTestContainer();

  const databaseUrl = `postgresql://${postgresContainer.getUsername()}:${postgresContainer.getPassword()}@${postgresContainer.getHost()}:${postgresContainer.getMappedPort(5432)}/${postgresContainer.getDatabase()}`;
  process.env.DATABASE_URL = databaseUrl;

  containers.setPostgresContainer(postgresContainer);

  const { container: redisContainer } = await redisTestContainer();

  const redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
  process.env.REDIS_URL = redisUrl;

  containers.setRedisContainer(redisContainer);
}
