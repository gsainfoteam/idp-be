import { PrismaService } from '@lib/prisma';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@prisma/client';

export const Roles = (role: RoleType) => SetMetadata('requiredRole', role);

type RequestShape = {
  user: { uuid: string };
  params: { clientId: string };
};

@Injectable()
export class ClientRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<RoleType>(
      'requiredRole',
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const req = context.switchToHttp().getRequest<RequestShape>();
    const userUuid = req.user?.uuid;
    const clientUuid = req.params?.clientId;

    if (!userUuid || !clientUuid) {
      throw new ForbiddenException('Invalid request context');
    }

    const membership = await this.prisma.userClientRelation.findUnique({
      where: {
        userUuid_clientUuid: {
          userUuid,
          clientUuid,
        },
      },
      select: { role: true },
    });
    if (!membership) throw new ForbiddenException('Not a member');

    const rank = (r: RoleType) => (r === RoleType.ADMIN ? 2 : 1);
    if (rank(membership.role) < rank(required)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
