import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Client } from '@prisma/client';
import { FastifyRequest } from 'fastify';

export const GetClient = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Client => {
    return ctx.switchToHttp().getRequest<FastifyRequest & { user: Client }>()
      .user;
  },
);
