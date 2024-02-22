import {
  AccessTokenResType,
  IdTokenResType,
  RefreshTokenResType,
  ScopeType,
} from './authorizeRes.type';

export type AuthorizeResType = Partial<AccessTokenResType> &
  Partial<IdTokenResType> &
  Partial<RefreshTokenResType> &
  Partial<ScopeType>;
