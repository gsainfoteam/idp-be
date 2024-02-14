/*
  Warnings:

  - Added the required column `updatedAt` to the `user_tb` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user_tb` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
