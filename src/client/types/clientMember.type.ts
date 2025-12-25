import { RoleType } from '@prisma/client';

export type ClientMember = {
  name: string;
  email: string;
  picture: string | null;
  memberships: {
    role: RoleType;
  }[];
};
