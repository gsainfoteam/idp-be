import { ClientScopeList } from 'src/client/types/clientScopes.type';

export const TokenScopeList = ['openid', 'offline_access'];
export type TokenScopeType = (typeof TokenScopeList)[number];

export const ScopeList = [...ClientScopeList, ...TokenScopeList];
export type ScopeType = (typeof ScopeList)[number];
