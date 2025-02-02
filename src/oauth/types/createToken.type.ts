import { User } from '@prisma/client';

import { Scope } from './Scopes.type';

export type CreateTokenType = {
  user: User;
  clientId: string;
  nonce?: string;
  scope: Readonly<Scope[]>;
  excludeAccessToken?: boolean;
  excludeScope?: boolean;
  excludeIdToken?: boolean;
  includeRefreshToken?: boolean;
  code?: string;
};
