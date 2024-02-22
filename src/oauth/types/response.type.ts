export const responseType = ['code', 'token', 'id_token'] as const;
export type ResponseType = (typeof responseType)[number];
