import { Prisma } from '@prisma/client';

export type ExtendedRefreshToken = Prisma.RefreshTokenGetPayload<{
  include: {
    consent: {
      include: {
        user: true;
      };
    };
  };
}>;
