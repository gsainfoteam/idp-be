import { psqlTestContainer } from '../util/database';
import { mailTestContainer } from '../util/mail';
import { redisTestContainer } from '../util/redis';
import { TestContainers } from './singleton';

export default async function globalSetup() {
  const containers = TestContainers.getInstance();

  // PostgreSQL 컨테이너 시작
  const { container: postgresContainer, service: prismaService } =
    await psqlTestContainer();
  containers.setPostgresContainer(postgresContainer);
  containers.setPrismaService(prismaService);

  // Redis 컨테이너 시작
  const { container: redisContainer, service: redisService } =
    await redisTestContainer();
  containers.setRedisContainer(redisContainer);
  containers.setRedisService(redisService);

  // Mail 컨테이너 시작
  const { container: mailContainer, config: mailConfig } =
    await mailTestContainer();
  containers.setMailContainer(mailContainer, mailConfig);
}
