import { Prisma } from '@prisma/client';

export type ConsentClient = Prisma.ClientGetPayload<{
  include: {
    consent: {
      select: { scopes: true };
    };
  };
}>;
