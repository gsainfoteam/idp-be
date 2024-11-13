import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class ExceptionLogFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionLogFilter');
  catch(exception: Error | HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest();
    const status = 
      exception instanceof HttpException ? exception.getStatus() : 500;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';
    const stack = exception instanceof Error ? exception.stack : '';

    this.logger.error(
      `Status: ${status} - Error Message: ${message}\nPath: ${request.url}\nStack Trace: ${stack}`
    );

    response.status(status).send({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
