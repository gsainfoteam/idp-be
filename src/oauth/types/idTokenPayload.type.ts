export type IdTokenPayloadType = {
  iss: string; // issuer of the token (idp)
  sub: string; // subject of the token (user)
  aud: string; // audience of the token (client)
  exp: number; // expiration time of the token
  iat: number; // issued at time of the token
  auth_time: number; // authentication time of the token
  nonce: string; // nonce value

  // custom claims of user's information
  profile?: string | null; // user's profile image
  name?: string;
  email?: string;
  student_id?: string;
  phone_number?: string;
};
