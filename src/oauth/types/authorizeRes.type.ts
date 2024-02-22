export type AuthorizeResType = Partial<CodeResType> &
  Partial<AccessTokenResType> &
  Partial<IdTokenResType> &
  Partial<RefreshTokenResType> &
  Partial<ScopeType>;

type CodeResType = {
  code: string;
};

type ScopeType = {
  scope: string;
};

type AccessTokenResType = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
};

type IdTokenResType = {
  idToken: string;
};

type RefreshTokenResType = {
  refreshToken: string;
};
