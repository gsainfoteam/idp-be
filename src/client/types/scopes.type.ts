export const ClientScopes = [
  'profile',
  'email',
  'phone_number',
  'student_id',
] as const;
export type ClientScope = (typeof ClientScopes)[number];
