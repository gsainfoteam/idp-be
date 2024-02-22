export type AuthorizeResType = Partial<CodeResType> &
  Partial<AccessTokenResType> &
  Partial<IdTokenResType> &
  Partial<RefreshTokenResType> &
  Partial<ScopeType>;

export type CodeResType = {
  code: string;
};

export type ScopeType = {
  scope: string;
};

export type AccessTokenResType = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
};

export type IdTokenResType = {
  idToken: string;
};

export type RefreshTokenResType = {
  refreshToken: string;
};
