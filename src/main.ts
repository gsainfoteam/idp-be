import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';

async function bootstrap() {
  const adapter = new FastifyAdapter();
  // CORS 설정
  const whitelist = [/https:\/\/.*gistory.me/, /http:\/\/localhost:3000/];
  adapter.enableCors({
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
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
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
  app.register(fastifyCookie);
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
