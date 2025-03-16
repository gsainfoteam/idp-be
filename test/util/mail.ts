import { GenericContainer, type StartedTestContainer } from 'testcontainers';

export type MailConfig = {
  smtpPort: number;
  apiPort: number;
  host: string;
};

export const mailTestContainer = async (): Promise<{
  container: StartedTestContainer;
  config: MailConfig;
}> => {
  const container: StartedTestContainer = await new GenericContainer(
    'greenmail/standalone:2.0.1',
  )
    .withExposedPorts(
      3025, // SMTP
      8080, // REST API
    )
    .start();

  const config: MailConfig = {
    host: container.getHost(),
    smtpPort: container.getMappedPort(3025),
    apiPort: container.getMappedPort(8080),
  };

  return { container, config };
};
