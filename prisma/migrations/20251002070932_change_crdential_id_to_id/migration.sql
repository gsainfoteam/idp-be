/*
  Warnings:

  - You are about to drop the column `credential_id` on the `authenticator` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "authenticator_credential_id_key";

-- AlterTable
ALTER TABLE "authenticator" DROP COLUMN "credential_id";
