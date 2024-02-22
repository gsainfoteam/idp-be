import { Scope } from './Scopes.type';

export type TokenCacheType = {
  userUuid: string;
  clientId: string;
  scope: Readonly<Scope[]>;
};
