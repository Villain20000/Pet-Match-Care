-- Catch-up migration for the v2 schema.
--
-- The `0_init` and `favorites` migrations predate the current
-- schema.prisma. This migration brings across the remaining models.
-- Run: npx prisma migrate deploy

-- ---------------------------------------------------------------------------
-- In-app messaging (συνομιλίες)
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" UUID NOT NULL,
    "topic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatParticipant" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roomId_userId" ON "ChatParticipant"("roomId", "userId");

-- CreateIndex
CREATE INDEX "ChatParticipant_userId_idx" ON "ChatParticipant"("userId");

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatMessage_roomId_createdAt_idx" ON "ChatMessage"("roomId", "createdAt");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- UGC Safety: Content Reporting & User Blocking (Google Play Policy)
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE "ContentReport" (
    "id" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentReport_reporterId_idx" ON "ContentReport"("reporterId");

-- CreateIndex
CREATE INDEX "ContentReport_targetType_targetId_idx" ON "ContentReport"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" UUID NOT NULL,
    "blockerId" UUID NOT NULL,
    "blockedId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "blockerId_blockedId" ON "UserBlock"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "UserBlock_blockerId_idx" ON "UserBlock"("blockerId");

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Donations & Emergency Campaigns (δωρεές & έκτακτες ανάγκες)
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE "DonationCampaign" (
    "id" UUID NOT NULL,
    "shelterId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "raisedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "neededItems" TEXT,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DonationCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DonationCampaign_shelterId_idx" ON "DonationCampaign"("shelterId");

-- AddForeignKey
ALTER TABLE "DonationCampaign" ADD CONSTRAINT "DonationCampaign_shelterId_fkey" FOREIGN KEY ("shelterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Stray Feeding Stations
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE "FeedingStation" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "lastRefilled" TIMESTAMP(3),
    "refillNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedingStation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedingStation_latitude_longitude_idx" ON "FeedingStation"("latitude", "longitude");

-- ---------------------------------------------------------------------------
-- Community Forum & Q&A
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityPost_category_idx" ON "CommunityPost"("category");

-- CreateIndex
CREATE INDEX "CommunityPost_authorId_idx" ON "CommunityPost"("authorId");

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "PostComment" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostComment_postId_idx" ON "PostComment"("postId");

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Virtual Adoption (Monthly Sponsorship)
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE "VirtualAdoption" (
    "id" UUID NOT NULL,
    "sponsorId" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "monthlyAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VirtualAdoption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VirtualAdoption_sponsorId_idx" ON "VirtualAdoption"("sponsorId");

-- CreateIndex
CREATE INDEX "VirtualAdoption_petId_idx" ON "VirtualAdoption"("petId");

-- AddForeignKey
ALTER TABLE "VirtualAdoption" ADD CONSTRAINT "VirtualAdoption_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualAdoption" ADD CONSTRAINT "VirtualAdoption_petId_fkey" FOREIGN KEY ("petId") REFERENCES "PetForAdoption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Pet Events & Sitters
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE "PetEvent" (
    "id" UUID NOT NULL,
    "organizerId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PetEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PetEvent_organizerId_idx" ON "PetEvent"("organizerId");

-- AddForeignKey
ALTER TABLE "PetEvent" ADD CONSTRAINT "PetEvent_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "PetSitter" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "services" TEXT NOT NULL,
    "ratePerHour" DOUBLE PRECISION NOT NULL,
    "phone" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PetSitter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PetSitter_city_idx" ON "PetSitter"("city");

-- ---------------------------------------------------------------------------
-- Lost Pet Sightings
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE "LostPetSighting" (
    "id" UUID NOT NULL,
    "lostPetId" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LostPetSighting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LostPetSighting_lostPetId_idx" ON "LostPetSighting"("lostPetId");

-- AddForeignKey
ALTER TABLE "LostPetSighting" ADD CONSTRAINT "LostPetSighting_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Gamification Challenges & Marketplace
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE "Challenge" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "karmaReward" INTEGER NOT NULL,
    "targetCount" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KarmaReward" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "karmaCost" INTEGER NOT NULL,
    "discountCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "KarmaReward_pkey" PRIMARY KEY ("id")
);
