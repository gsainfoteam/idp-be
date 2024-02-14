import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import expressBasicAuth from 'express-basic-auth';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  // Swagger 보안 설정
  const configService = app.get(ConfigService);
  app.use(
    ['/api'],
    expressBasicAuth({
      challenge: true,
      users: {
        [configService.getOrThrow<string>('SWAGGER_USER')]:
          configService.getOrThrow<string>('SWAGGER_PASSWORD'),
      },
    }),
  );
  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Infoteam-Idp API Docs')
    .setDescription('인포팀 idp의 API 문서입니다.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(3000);
}
bootstrap();
