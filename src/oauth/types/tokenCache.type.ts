import { ScopeType } from './scope.type';

export const TokenToList = ['user', 'client'];
export type TokenToType = (typeof TokenToList)[number];

export type TokenCacheType = {
  to: TokenToType;
  sub?: string;
  clientId: string;
  scope: readonly ScopeType[];
};
