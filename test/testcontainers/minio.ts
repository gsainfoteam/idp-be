import { MinioContainer, StartedMinioContainer } from '@testcontainers/minio';
import * as minio from 'minio';

export const minioTestContainer = async (): Promise<{
  container: StartedMinioContainer;
}> => {
  const container = await new MinioContainer().start();

  const host = container.getHost();
  const port = container.getMappedPort(9000);
  const endpoint = `http://${host}:${port}`;

  const accessKeyId: string = 'minioadmin';
  const secretAccessKey: string = 'minioadmin';
  const region: string = 'ap-northeast-2';
  const bucket: string = 'test-bucket';

  const client = new minio.Client({
    endPoint: endpoint,
    port,
    useSSL: false,
    accessKey: accessKeyId,
    secretKey: secretAccessKey,
  });

  const exists = await client.bucketExists(bucket).catch(() => false);
  if (!exists) {
    await client.makeBucket(bucket, region);
  }

  return { container };
};
