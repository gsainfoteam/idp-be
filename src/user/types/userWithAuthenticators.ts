import { Prisma } from '@prisma/client';

export type UserWithAuthenticators = Prisma.UserGetPayload<{
  include: {
    authenticators: true;
  };
}>;
