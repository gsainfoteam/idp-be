import { GenericContainer, StartedTestContainer } from 'testcontainers';

export type MinioConfig = {
  container: StartedTestContainer;
  host: string;
  port: number;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
};

/**
 * 테스트 환경에서 사용할 MinIO 컨테이너를 실행하고
 * 관련 설정 정보를 포함한 MinioConfig를 반환한다.
 */
export const startMinio = async (): Promise<MinioConfig> => {
  const container = await new GenericContainer('minio/minio')
    .withExposedPorts(9000)
    .withEnvironment({ MINIO_ROOT_USER: 'minioadmin' })
    .withEnvironment({ MINIO_ROOT_PASSWORD: 'minioadmin' })
    .withCommand(['server', '/data'])
    .start();

  const host = container.getHost();
  const port = container.getMappedPort(9000);
  const endpoint = `http://${host}:${port}`;

  const config: MinioConfig = {
    container,
    host,
    port,
    endpoint,
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
    region: 'us-east-1',
    bucket: 'test-bucket',
  };

  // Set environment variables for the MinIO client
  process.env.AWS_S3_ENDPOINT = config.endpoint;

  return config;
};
