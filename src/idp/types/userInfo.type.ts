import { User } from '@prisma/client';

export type UserInfo = Omit<User, 'password'>;
