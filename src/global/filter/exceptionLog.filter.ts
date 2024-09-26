import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch(HttpException)
export class ExceptionLogFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    this.logger.debug(
      exception.message +
        '\nwhere ' +
        request.url +
        '\ncaused by ' +
        exception.cause,
    );

    response.status(status).send({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
