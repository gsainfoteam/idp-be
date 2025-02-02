import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { UserInfo } from '../types/userInfo.type';

export const GetUser = createParamDecorator(
  (data, ctx: ExecutionContext): UserInfo => {
    return ctx.switchToHttp().getRequest().user;
  },
);
