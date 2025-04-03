import { psqlTestContainer } from '../../../testcontainers/database';
import { minioTestContainer } from '../../../testcontainers/minio';
import { redisTestContainer } from '../../../testcontainers/redis';
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

  const { container: minioContainer } = await minioTestContainer();
  const endpoint = `http://${minioContainer.getHost()}:${minioContainer.getMappedPort(9000)}`;
  process.env.AWS_S3_ENDPOINT = endpoint;
  containers.setMinioContainer(minioContainer);
}
