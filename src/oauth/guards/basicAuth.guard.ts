import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    if (request.headers.authorization) {
      const basicAuthHeader = request.headers.authorization.split(' ');
      if (basicAuthHeader[0] === 'Basic') {
        const basicAuthContent = Buffer.from(
          basicAuthHeader[1],
          'base64',
        ).toString();
        const [username, password] = basicAuthContent.split(':');
        request.body = {
          ...(request.body || {}),
          clientId: username,
          clientSecret: password,
        };
      }
    }
    return true;
  }
}
