/*
  Warnings:

  - The `transports` column on the `passkey_tb` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "passkey_tb" DROP COLUMN "transports",
ADD COLUMN     "transports" TEXT[];
