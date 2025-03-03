-- CreateTable
CREATE TABLE "user" (
    "uuid" UUID NOT NULL,
    "password" TEXT NOT NULL,
    "profile" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "phone_number" VARCHAR(11) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "client" (
    "uuid" UUID NOT NULL,
    "secret" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "urls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "idTokenAllowed" BOOLEAN NOT NULL DEFAULT false,
    "scopes" TEXT[],
    "optional_scopes" TEXT[],

    CONSTRAINT "client_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scopes" TEXT[],
    "clientUuid" UUID NOT NULL,
    "userUuid" UUID NOT NULL,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "consent" (
    "clientUuid" UUID NOT NULL,
    "userUuid" UUID NOT NULL,
    "scopes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consent_pkey" PRIMARY KEY ("clientUuid","userUuid")
);

-- CreateTable
CREATE TABLE "_ClientToUser" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ClientToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_student_id_key" ON "user"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_number_key" ON "user"("phone_number");

-- CreateIndex
CREATE INDEX "_ClientToUser_B_index" ON "_ClientToUser"("B");

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_clientUuid_fkey" FOREIGN KEY ("clientUuid") REFERENCES "client"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent" ADD CONSTRAINT "consent_clientUuid_fkey" FOREIGN KEY ("clientUuid") REFERENCES "client"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent" ADD CONSTRAINT "consent_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientToUser" ADD CONSTRAINT "_ClientToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "client"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientToUser" ADD CONSTRAINT "_ClientToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
