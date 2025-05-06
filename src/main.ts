import fastifyCookie from '@fastify/cookie';
import { MethodNotAllowedException } from '@nestjs/common';
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
  // inject the ConfigService
  const configService = app.get(ConfigService);
  // CORS setup
  const whitelist = [
    /^https:\/\/.*\.idp-fe-49s\.pages\.dev$/, // for idp fe preview pages
    /^https:\/\/.*\.idp-fe\.pages\.dev$/, // for idp fe preview pages
    /^https:\/\/.*idp\.gistory\.me$/, // for idp fe production pages
    /^http:\/\/localhost:3000$/, // for local development
    /^http:\/\/localhost:5173$/, // for local development
  ];
  const pathWhitelist = [
    '/oauth/token',
    '/oauth/certs',
    '/oauth/userinfo',
    '/.well-known/openid-configuration',
  ];
  app.enableCors({
    delegator: (req, callback) => {
      const origin = req.headers.origin;
      const url = req.url;
      if (!origin) {
        // No origin, no CORS
        callback(null, {
          origin: whitelist,
          methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
          optionsSuccessStatus: 204,
          preflightContinue: false,
          credentials: true,
        });
        return;
      } else if (pathWhitelist.some((path) => url.endsWith(path))) {
        // Allow all origins for the specified paths
        callback(null, {
          origin,
          methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
          optionsSuccessStatus: 204,
          preflightContinue: false,
          credentials: true,
        });
      } else if (whitelist.some((regex) => regex.test(origin))) {
        // Allow only whitelisted origins
        callback(null, {
          origin,
          methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
          optionsSuccessStatus: 204,
          preflightContinue: false,
          credentials: true,
        });
      } else {
        callback(new MethodNotAllowedException(), {
          origin: false,
          methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
          optionsSuccessStatus: 204,
          preflightContinue: false,
          credentials: true,
        });
      }
    },
  });
  // cookie parser setup
  await app.register(fastifyCookie);
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
