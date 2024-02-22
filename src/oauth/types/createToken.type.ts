import { UserInfo } from 'src/idp/types/userInfo.type';
import { Scope } from './Scopes.type';

export type CreateTokenType = {
  user: UserInfo;
  clientId: string;
  nonce?: string;
  scope: Readonly<Scope[]>;
  excludeAccessToken?: boolean;
  excludeScope?: boolean;
  excludeIdToken?: boolean;
  includeRefreshToken?: boolean;
  code?: string;
};
