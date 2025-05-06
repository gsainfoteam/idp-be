import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { FastifyReply } from 'fastify';
import { Observable } from 'rxjs';

@Injectable()
export class AllowCorsInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const response = context.switchToHttp().getResponse<FastifyReply>();
    const corsOptions: CorsOptions = {
      origin: '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      credentials: true,
      optionsSuccessStatus: 204,
      preflightContinue: false,
    };
    response.header('Access-Control-Allow-Origin', corsOptions.origin);
    response.header('Access-Control-Allow-Methods', corsOptions.methods);
    response.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders);
    response.header(
      'Access-Control-Allow-Credentials',
      String(corsOptions.credentials),
    );
    return next.handle();
  }
}
