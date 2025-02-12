import { ScopeType } from './scope.type';

export const TokenSubList = ['user', 'client'];
export type TokenSubType = (typeof TokenSubList)[number];

export type TokenCacheType = {
  sub: TokenSubType;
  clientId: string;
  scope: ScopeType[];
};
