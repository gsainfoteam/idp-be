export class tokenResDto {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  id_token: string;
}

// error response
// error : invalid_request, invalid_client, invalid_grant, unauthorized_client, unsupported_grant_type, invalid_scope
