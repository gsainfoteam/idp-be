-- DropIndex
DROP INDEX "user_phone_number_key";

-- DropIndex
DROP INDEX "user_student_id_key";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "isIdVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPhoneNumberVerified" BOOLEAN NOT NULL DEFAULT false;
