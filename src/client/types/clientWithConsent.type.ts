import { Prisma } from '@prisma/client';

export type ClientWithConsent = Prisma.ClientGetPayload<{
  include: {
    consent: {
      select: { scopes: true };
    };
  };
}>;
