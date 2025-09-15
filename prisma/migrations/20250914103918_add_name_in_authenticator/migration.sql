/*
  Warnings:

  - Added the required column `name` to the `authenticator` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "authenticator_credential_id_key";

-- AlterTable
ALTER TABLE "authenticator" ADD COLUMN     "name" TEXT NOT NULL;