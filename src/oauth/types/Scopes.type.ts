const scopesRequireConsent = [
  'profile',
  'email',
  'phone',
  'student_id',
] as const;
export const allowedScopes = [
  'openid',
  'offline_access',
  ...scopesRequireConsent,
] as const;
export type Scope = (typeof allowedScopes)[number];
