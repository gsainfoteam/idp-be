import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { ExceptionLogFilter } from './global/filter/exceptionLog.filter';
import { fastifyCookie } from '@fastify/cookie';
import cors from '@fastify/cors';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  // CORS 설정
  const whitelist = [
    /^https:\/\/.*\.idp-fe\.pages\.dev$/, // for idp fe preview pages
    /^https:\/\/.*idp\.gistory\.me$/, // for idp fe production pages
    /^http:\/\/localhost:3000$/, // for local development
  ];
  await app.register(cors, {
    origin: function (origin, callback) {
      if (origin && whitelist.some((regex) => regex.test(origin))) {
        callback(null, origin);
      } else if (!origin) {
        callback(null, whitelist);
      } else {
        callback(new Error('Not allowed by CORS'), whitelist);
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    optionsSuccessStatus: 204,
    preflightContinue: false,
    credentials: true,
  });
  // cookie 설정
  await app.register(fastifyCookie);
  // ConfigService 주입
  const configService = app.get(ConfigService);
  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Infoteam-Idp API Docs')
    .setDescription('infoteam-idp의 API 문서입니다.')
    .setVersion(configService.getOrThrow<string>('API_VERSION'))
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
  // 글로벌 예외처리
  app.useGlobalFilters(new ExceptionLogFilter());
  // 서버 실행
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
