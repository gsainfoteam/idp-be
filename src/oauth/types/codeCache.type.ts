import { Scope } from './Scopes.type';

export type CodeCacheType = {
  userUuid: string;
  clientId: string;
  nonce?: string;
  redirectUri: string;
  scope: Readonly<Scope[]>;
};
