-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DISALLOW', 'ALLOW');

-- CreateTable
CREATE TABLE "user_tb" (
    "uuid" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "phone_number" VARCHAR(11) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'USER',

    CONSTRAINT "user_tb_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "client_tb" (
    "uuid" UUID NOT NULL,
    "id" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "urls" TEXT[],
    "role" "Role" NOT NULL DEFAULT 'DISALLOW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_tb_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "token" TEXT NOT NULL,
    "scopes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientUuid" UUID NOT NULL,
    "userUuid" UUID NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "consent_tb" (
    "clientUuid" UUID NOT NULL,
    "userUuid" UUID NOT NULL,
    "scopes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consent_tb_pkey" PRIMARY KEY ("clientUuid","userUuid")
);

-- CreateTable
CREATE TABLE "_ClientToUser" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "user_tb_email_key" ON "user_tb"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_tb_student_id_key" ON "user_tb"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_tb_phone_number_key" ON "user_tb"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "client_tb_id_key" ON "client_tb"("id");

-- CreateIndex
CREATE UNIQUE INDEX "_ClientToUser_AB_unique" ON "_ClientToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ClientToUser_B_index" ON "_ClientToUser"("B");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_clientUuid_userUuid_fkey" FOREIGN KEY ("clientUuid", "userUuid") REFERENCES "consent_tb"("clientUuid", "userUuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_tb" ADD CONSTRAINT "consent_tb_clientUuid_fkey" FOREIGN KEY ("clientUuid") REFERENCES "client_tb"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_tb" ADD CONSTRAINT "consent_tb_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "user_tb"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientToUser" ADD CONSTRAINT "_ClientToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "client_tb"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientToUser" ADD CONSTRAINT "_ClientToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user_tb"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
