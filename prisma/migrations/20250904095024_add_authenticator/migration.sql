-- CreateTable
CREATE TABLE "authenticator" (
    "id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "public_key" BYTEA NOT NULL,
    "counter" INTEGER NOT NULL,
    "user_uuid" UUID NOT NULL,

    CONSTRAINT "authenticator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "authenticator_credential_id_key" ON "authenticator"("credential_id");

-- AddForeignKey
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
