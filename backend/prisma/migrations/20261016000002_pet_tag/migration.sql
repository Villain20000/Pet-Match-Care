-- QR Pet Tags (Google Play compliance).
--
-- The `20261016000001_v2_core_models` migration was missing the PetTag
-- table even though schema.prisma declares it. Every platform-features
-- pet-tag route (POST/GET /api/platform-features/pet-tags) failed at
-- runtime with "relation \"PetTag\" does not exist".
-- Run: npx prisma migrate deploy

-- ---------------------------------------------------------------------------
-- QR Pet Tags
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE "PetTag" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "petName" TEXT NOT NULL,
    "species" TEXT NOT NULL DEFAULT 'DOG',
    "contactPhone" TEXT NOT NULL,
    "medicalNotes" TEXT,
    "isLost" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PetTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PetTag_code_key" ON "PetTag"("code");

-- CreateIndex
CREATE INDEX "PetTag_ownerId_idx" ON "PetTag"("ownerId");

-- AddForeignKey
ALTER TABLE "PetTag" ADD CONSTRAINT "PetTag_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
