import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type PostgresqlConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export const psqlTestContainer = async (): Promise<{
  container: StartedPostgreSqlContainer;
}> => {
  const container = await new PostgreSqlContainer().start();

  const config: PostgresqlConfig = {
    host: container.getHost(),
    port: container.getMappedPort(5432),
    database: container.getDatabase(),
    user: container.getUsername(),
    password: container.getPassword(),
  };

  const databaseUrl = `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;

  await execAsync(
    `DATABASE_URL=${databaseUrl} npx prisma migrate dev --preview-feature`,
  );

  return { container };
};
