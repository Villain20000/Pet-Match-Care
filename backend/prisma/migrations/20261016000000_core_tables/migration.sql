-- Catch-up migration for the v2 schema.
--
-- The `0_init` and `favorites` migrations predate the current
-- schema.prisma, which defines 18 further models. Only the two the
-- seeder (and the foster / medical-records endpoints) needs are
-- brought across here; the rest can follow in their own migration.
-- Run: npx prisma migrate deploy

-- ---------------------------------------------------------------------------
-- Foster care (προσωρινή φιλοξενία)
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE "FosterProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "city" TEXT NOT NULL,
    "maxPets" INTEGER NOT NULL DEFAULT 1,
    "preferredSpecies" "Species" NOT NULL DEFAULT 'DOG',
    "hasGarden" BOOLEAN NOT NULL DEFAULT false,
    "hasOtherPets" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FosterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FosterProfile_userId_key" ON "FosterProfile"("userId");

-- CreateIndex
CREATE INDEX "FosterProfile_userId_idx" ON "FosterProfile"("userId");

-- AddForeignKey
ALTER TABLE "FosterProfile" ADD CONSTRAINT "FosterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Pet medical records (ψηφιακό βιβλιορία υγείας)
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE "PetMedicalRecord" (
    "id" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "recordType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "vetName" TEXT,
    "nextDueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PetMedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PetMedicalRecord_petId_idx" ON "PetMedicalRecord"("petId");

-- AddForeignKey
ALTER TABLE "PetMedicalRecord" ADD CONSTRAINT "PetMedicalRecord_petId_fkey" FOREIGN KEY ("petId") REFERENCES "PetForAdoption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
