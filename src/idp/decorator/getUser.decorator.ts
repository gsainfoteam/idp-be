import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { User } from '@prisma/client';

export const GetUser = createParamDecorator(
  (data, ctx: ExecutionContext): Omit<User, 'password'> => {
    return ctx.switchToHttp().getRequest().user;
  },
);
