-- CreateTable
CREATE TABLE "passkey_tb" (
    "credId" TEXT NOT NULL,
    "credPublicKey" BYTEA NOT NULL,
    "internalUserId" UUID NOT NULL,
    "webauthnUserId" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "transports" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3),
    "deleteAt" TIMESTAMP(3),
    "userNotes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "passkey_tb_pkey" PRIMARY KEY ("credId")
);

-- CreateIndex
CREATE INDEX "passkey_tb_internalUserId_idx" ON "passkey_tb"("internalUserId");

-- AddForeignKey
ALTER TABLE "passkey_tb" ADD CONSTRAINT "passkey_tb_internalUserId_fkey" FOREIGN KEY ("internalUserId") REFERENCES "user_tb"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
