import { VerificationType } from './verification.type';

export type VerificationJwtPayloadType = {
  iss: string; // issuer of the token (idp)
  sub: string; // subject of the token (verification email or phone number...)

  hint: VerificationType; // hint for the verification (email or phone number...)
};
