import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';

@Injectable()
export class AllowCorsInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const response = context.switchToHttp().getResponse<FastifyReply>();
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const corsOptions = {
      origin: '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      optionsSuccessStatus: 204,
      preflightContinue: false,
      credentials: true,
    } satisfies CorsOptions;
    response.header(
      'Access-Control-Allow-Origin',
      request.headers.origin || corsOptions.origin,
    );
    response.header('Access-Control-Allow-Methods', corsOptions.methods);
    response.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders);
    response.header(
      'Access-Control-Allow-Credentials',
      String(corsOptions.credentials),
    );
    return next.handle();
  }
}
