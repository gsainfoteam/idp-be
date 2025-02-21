import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';
import { FastifyRequest } from 'fastify';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    return ctx.switchToHttp().getRequest<FastifyRequest & { user: User }>()
      .user;
  },
);
