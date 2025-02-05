export class authorizationReqDto {
  response_type: string;
  client_id: string;
  code_challenge: string;
  code_challenge_method: string;
  redirect_uri: string;
  scope: string[];
  state: string;
}

// response url ?code=123&state=123&iss=https://auth-server.com

export class tokenReqDto {
  grant_type: string; // authorization_code, refresh_token, client_credentials
  client_id: string; // for code

  code: string;
  code_verifier: string;
}
