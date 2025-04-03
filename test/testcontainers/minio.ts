import { ConfigService } from '@nestjs/config';
import { MinioContainer, StartedMinioContainer } from '@testcontainers/minio';
import * as minio from 'minio';

export const minioTestContainer = async (
  configService: ConfigService,
): Promise<{ container: StartedMinioContainer }> => {
  const container = await new MinioContainer().start();

  const host = container.getHost();
  const port = container.getMappedPort(9000);
  const endpoint = `http://${host}:${port}`;

  const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID')!;
  const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY')!;
  const region = configService.get<string>('AWS_REGION')!;
  const bucket = configService.get<string>('AWS_S3_BUCKET')!;

  const client = new minio.Client({
    endPoint: host,
    port,
    useSSL: false,
    accessKey: accessKeyId,
    secretKey: secretAccessKey,
  });

  const exists = await client.bucketExists(bucket).catch(() => false);
  if (!exists) {
    await client.makeBucket(bucket, region);
  }

  configService.set('AWS_S3_ENDPOINT', endpoint);

  return { container };
};
