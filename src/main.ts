import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import expressBasicAuth from 'express-basic-auth';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
    .setVersion('2024-04')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        name: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .addBasicAuth(
      {
        type: 'http',
        scheme: 'basic',
      },
      'client-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      displayRequestDuration: true,
    },
  });
  // Cookie 설정
  app.use(cookieParser());
  // CORS 설정
  const whitelist = [/https:\/\/.*gistory.me/, /http:\/\/localhost:3000/];
  app.enableCors({
    origin: function (origin, callback) {
      if (!origin || whitelist.some((regex) => regex.test(origin))) {
        callback(null, origin);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });
  await app.listen(3000);
}
bootstrap();
