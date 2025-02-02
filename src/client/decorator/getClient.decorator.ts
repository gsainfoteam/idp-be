import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Client } from '@prisma/client';

export const GetClient = createParamDecorator(
  (data, ctx: ExecutionContext): Client => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
