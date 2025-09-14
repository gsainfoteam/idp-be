/*
  Warnings:

  - Added the required column `name` to the `authenticator` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "authenticator" ADD COLUMN     "name" TEXT NOT NULL;
