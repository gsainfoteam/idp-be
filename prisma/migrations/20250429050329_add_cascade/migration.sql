-- DropForeignKey
ALTER TABLE "consent" DROP CONSTRAINT "consent_clientUuid_fkey";

-- DropForeignKey
ALTER TABLE "consent" DROP CONSTRAINT "consent_userUuid_fkey";

-- DropForeignKey
ALTER TABLE "refresh_token" DROP CONSTRAINT "refresh_token_clientUuid_fkey";

-- DropForeignKey
ALTER TABLE "refresh_token" DROP CONSTRAINT "refresh_token_userUuid_fkey";

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_clientUuid_fkey" FOREIGN KEY ("clientUuid") REFERENCES "client"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent" ADD CONSTRAINT "consent_clientUuid_fkey" FOREIGN KEY ("clientUuid") REFERENCES "client"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent" ADD CONSTRAINT "consent_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
