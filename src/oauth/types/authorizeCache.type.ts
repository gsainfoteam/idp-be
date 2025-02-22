import { CodeChallengeMethod } from './codeChallengeMethod.type';
import { ScopeType } from './scope.type';

export type AuthorizeCacheType = {
  clientId: string;
  UserUuid: string;
  codeChallengeMethod: CodeChallengeMethod;
  codeChallenge: string;
  redirectUri: string;
  scope: ScopeType[];
};
