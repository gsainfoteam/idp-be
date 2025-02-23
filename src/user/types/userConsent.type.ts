import { Prisma } from '@prisma/client';

export type UserConsentType = Prisma.ConsentGetPayload<{
  include: {
    client: {
      select: {
        name: true;
        uuid: true;
        scopes: true;
        optionalScopes: true;
      };
    };
  };
}>;
