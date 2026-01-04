import { RoleType } from '@prisma/client';

export type ClientMember = {
  uuid: string;
  name: string;
  email: string;
  picture: string | null;
  memberships: {
    role: RoleType;
  }[];
};
