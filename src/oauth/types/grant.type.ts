export const GrantTypeList = [
  'authorization_code',
  'client_credentials',
  'refresh_token',
];

export type GrantType = (typeof GrantTypeList)[number];

export type GrantContentType =
  | CodeGrantContentType
  | RefreshTokenGrantContentType
  | ClientCredentialsGrantContentType;

export type CodeGrantContentType = {
  grant_type: 'authorization_code';
  client_id: string;

  code: string;
  code_verifier: string;
};

// Basic Auth in headers or use the client_id
export type RefreshTokenGrantContentType = {
  grant_type: 'refresh_token';
  client_id?: string;

  refresh_token: string;
};

export type ClientCredentialsGrantContentType = {
  grant_type: 'client_credentials';
  client_id: string;

  client_secret: string;
  scope: string[];
};
