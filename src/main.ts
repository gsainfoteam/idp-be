import fastifyCookie from '@fastify/cookie';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  // CORS setup
  const whitelist = [
    /^https:\/\/.*\.idp-fe\.pages\.dev$/, // for idp fe preview pages
    /^https:\/\/.*idp\.gistory\.me$/, // for idp fe production pages
    /^http:\/\/localhost:3000$/, // for local development
  ];
  app.enableCors({
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
  // cookie parser setup
  await app.register(fastifyCookie);
  // inject the ConfigService
  const configService = app.get(ConfigService);
  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Infoteam-IdP API docs')
    .setDescription('The Infoteam-IdP API documentation')
    .setVersion(configService.getOrThrow<string>('API_VERSION'))
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        name: 'JWT',
        in: 'header',
      },
      'user:jwt',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      displayRequestDuration: true,
    },
  });
  // Execute the application
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
