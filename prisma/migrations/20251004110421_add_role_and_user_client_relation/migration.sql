-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "user_client_relations" (
    "userUuid" UUID NOT NULL,
    "clientUuid" UUID NOT NULL,
    "role" "RoleType" NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "user_client_relations_pkey" PRIMARY KEY ("userUuid","clientUuid")
);

-- AddForeignKey
ALTER TABLE "user_client_relations" ADD CONSTRAINT "user_client_relations_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_client_relations" ADD CONSTRAINT "user_client_relations_clientUuid_fkey" FOREIGN KEY ("clientUuid") REFERENCES "client"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

--Moving old data
INSERT INTO "user_client_relations" ("clientUuid", "userUuid", "role")
SELECT  "_ClientToUser"."A"  AS "clientUuid",
        "_ClientToUser"."B"  AS "userUuid",
        'MEMBER'::"RoleType"  AS "role"
FROM "_ClientToUser"
ON CONFLICT ("userUuid","clientUuid") DO NOTHING;

--Setting Owners
WITH one_member_clients AS (
  SELECT "clientUuid"
  FROM "user_client_relations"
  GROUP BY "clientUuid"
  HAVING COUNT(*) = 1
)
UPDATE "user_client_relations" ucr
SET "role" = 'OWNER'::"RoleType"
WHERE ucr."clientUuid" IN (SELECT "clientUuid" FROM one_member_clients);

-- DropForeignKey
ALTER TABLE "_ClientToUser" DROP CONSTRAINT "_ClientToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_ClientToUser" DROP CONSTRAINT "_ClientToUser_B_fkey";

-- DropTable
DROP TABLE "_ClientToUser";