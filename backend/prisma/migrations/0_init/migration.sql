-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'VOLUNTEER', 'MUNICIPAL_WORKER', 'SHELTER_ADMIN', 'PLATFORM_ADMIN');
-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');
-- CreateEnum
CREATE TYPE "Species" AS ENUM ('DOG', 'CAT', 'OTHER');
-- CreateEnum
CREATE TYPE "AdoptionStatus" AS ENUM ('AVAILABLE', 'ADOPTED', 'DRAFT', 'SUBMITTED', 'SCREENING', 'HOME_CHECK_SCHEDULED', 'APPROVED', 'REJECTED', 'ADOPTION_COMPLETED', 'CLOSED');
-- CreateEnum
CREATE TYPE "ReportCondition" AS ENUM ('STABLE', 'INJURED', 'CRITICAL', 'DECEASED');
-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'EXPIRED');
-- CreateEnum
CREATE TYPE "BadgeRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');
-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('STREAK_REMINDER', 'KARMA_REWARD', 'BADGE_UNLOCKED', 'BADGE_EARNED', 'ADOPTION_UPDATE', 'ADOPTION_STATUS_CHANGED', 'POISON_ALERT_NEARBY', 'STRAY_REPORT_NEARBY', 'STRAY_REPORT_UPDATE', 'LOST_PET_MATCH', 'GENERAL');
-- CreateEnum
CREATE TYPE "SpotCategory" AS ENUM ('PARK', 'BEACH', 'CAFE', 'VET', 'PET_STORE', 'TRAIL', 'URBAN', 'OTHER');
-- CreateEnum
CREATE TYPE "PoisonSeverity" AS ENUM ('HIGH', 'CRITICAL');
-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "fullName" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CITIZEN',
    "karmaPoints" INTEGER NOT NULL DEFAULT 0,
    "locale" TEXT NOT NULL DEFAULT 'el',
    "pushToken" TEXT,
    "homeLatitude" DOUBLE PRECISION,
    "homeLongitude" DOUBLE PRECISION,
    "lastSeenAt" TIMESTAMP(3),
    "emailVerifiedAt" TIMESTAMP(3),
    "totpSecretEnc" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "OAuthIdentity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerSubjectId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OAuthIdentity_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loggedOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "RecoveryCode" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecoveryCode_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "StrayReport" (
    "id" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "condition" "ReportCondition" NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "addressHint" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "assignedMunicipality" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StrayReport_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "StrayReportUpdate" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StrayReportUpdate_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "LostPet" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "species" "Species" NOT NULL,
    "breed" TEXT,
    "microchipId" TEXT,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "lastSeenLat" DOUBLE PRECISION NOT NULL,
    "lastSeenLng" DOUBLE PRECISION NOT NULL,
    "addressHint" TEXT,
    "reward" TEXT,
    "isFound" BOOLEAN NOT NULL DEFAULT false,
    "foundAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LostPet_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "PetForAdoption" (
    "id" UUID NOT NULL,
    "shelterId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "species" "Species" NOT NULL,
    "age" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "status" "AdoptionStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "isMicrochipped" BOOLEAN NOT NULL DEFAULT false,
    "microchipNumber" TEXT,
    "isVaccinated" BOOLEAN NOT NULL DEFAULT false,
    "isSterilized" BOOLEAN NOT NULL DEFAULT false,
    "healthNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PetForAdoption_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "AdoptionApplication" (
    "id" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "applicantId" UUID NOT NULL,
    "shelterId" UUID NOT NULL,
    "state" "AdoptionStatus" NOT NULL DEFAULT 'DRAFT',
    "motivation" TEXT NOT NULL,
    "homeEnvironment" JSONB NOT NULL,
    "questionnaire" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdoptionApplication_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "ApplicationHomeCheck" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "inspectorName" TEXT NOT NULL,
    "inspectorNotes" TEXT,
    "passed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApplicationHomeCheck_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "ApplicationAudit" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "fromState" "AdoptionStatus" NOT NULL,
    "toState" "AdoptionStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationAudit_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Badge" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconEmoji" TEXT NOT NULL,
    "rarity" "BadgeRarity" NOT NULL DEFAULT 'COMMON',
    "predicate" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "UserBadge" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "badgeId" UUID NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "PetFriendlySpot" (
    "id" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SpotCategory" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PetFriendlySpot_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "SpotVote" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "spotId" UUID NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpotVote_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "PoisonAlert" (
    "id" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "addressHint" TEXT,
    "description" TEXT,
    "severity" "PoisonSeverity" NOT NULL DEFAULT 'HIGH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PoisonAlert_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DailyStreak" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyStreak_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
-- CreateIndex
CREATE INDEX "User_homeLatitude_homeLongitude_idx" ON "User"("homeLatitude", "homeLongitude");
-- CreateIndex
CREATE INDEX "User_pushToken_idx" ON "User"("pushToken");
-- CreateIndex
CREATE INDEX "OAuthIdentity_userId_idx" ON "OAuthIdentity"("userId");
-- CreateIndex
CREATE UNIQUE INDEX "OAuthIdentity_provider_providerSubjectId_key" ON "OAuthIdentity"("provider", "providerSubjectId");
-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
-- CreateIndex
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");
-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");
-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
-- CreateIndex
CREATE INDEX "RecoveryCode_userId_idx" ON "RecoveryCode"("userId");
-- CreateIndex
CREATE INDEX "StrayReport_status_idx" ON "StrayReport"("status");
-- CreateIndex
CREATE INDEX "StrayReport_assignedMunicipality_idx" ON "StrayReport"("assignedMunicipality");
-- CreateIndex
CREATE INDEX "StrayReport_latitude_longitude_idx" ON "StrayReport"("latitude", "longitude");
-- CreateIndex
CREATE INDEX "StrayReport_reporterId_idx" ON "StrayReport"("reporterId");
-- CreateIndex
CREATE INDEX "StrayReportUpdate_reportId_idx" ON "StrayReportUpdate"("reportId");
-- CreateIndex
CREATE INDEX "StrayReportUpdate_createdAt_idx" ON "StrayReportUpdate"("createdAt");
-- CreateIndex
CREATE INDEX "LostPet_species_isFound_idx" ON "LostPet"("species", "isFound");
-- CreateIndex
CREATE INDEX "LostPet_lastSeenLat_lastSeenLng_idx" ON "LostPet"("lastSeenLat", "lastSeenLng");
-- CreateIndex
CREATE INDEX "LostPet_ownerId_idx" ON "LostPet"("ownerId");
-- CreateIndex
CREATE INDEX "PetForAdoption_status_species_idx" ON "PetForAdoption"("status", "species");
-- CreateIndex
CREATE INDEX "PetForAdoption_shelterId_idx" ON "PetForAdoption"("shelterId");
-- CreateIndex
CREATE INDEX "AdoptionApplication_applicantId_idx" ON "AdoptionApplication"("applicantId");
-- CreateIndex
CREATE INDEX "AdoptionApplication_shelterId_state_idx" ON "AdoptionApplication"("shelterId", "state");
-- CreateIndex
CREATE UNIQUE INDEX "AdoptionApplication_petId_applicantId_key" ON "AdoptionApplication"("petId", "applicantId");
-- CreateIndex
CREATE UNIQUE INDEX "ApplicationHomeCheck_applicationId_key" ON "ApplicationHomeCheck"("applicationId");
-- CreateIndex
CREATE INDEX "ApplicationAudit_applicationId_createdAt_idx" ON "ApplicationAudit"("applicationId", "createdAt");
-- CreateIndex
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");
-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");
-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");
-- CreateIndex
CREATE INDEX "PetFriendlySpot_category_isFlagged_idx" ON "PetFriendlySpot"("category", "isFlagged");
-- CreateIndex
CREATE INDEX "PetFriendlySpot_latitude_longitude_idx" ON "PetFriendlySpot"("latitude", "longitude");
-- CreateIndex
CREATE INDEX "SpotVote_spotId_idx" ON "SpotVote"("spotId");
-- CreateIndex
CREATE UNIQUE INDEX "SpotVote_userId_spotId_key" ON "SpotVote"("userId", "spotId");
-- CreateIndex
CREATE INDEX "PoisonAlert_expiresAt_idx" ON "PoisonAlert"("expiresAt");
-- CreateIndex
CREATE INDEX "PoisonAlert_latitude_longitude_idx" ON "PoisonAlert"("latitude", "longitude");
-- CreateIndex
CREATE INDEX "PoisonAlert_reporterId_idx" ON "PoisonAlert"("reporterId");
-- CreateIndex
CREATE INDEX "DailyStreak_userId_idx" ON "DailyStreak"("userId");
-- CreateIndex
CREATE UNIQUE INDEX "DailyStreak_userId_date_key" ON "DailyStreak"("userId", "date");
-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
-- AddForeignKey
ALTER TABLE "OAuthIdentity" ADD CONSTRAINT "OAuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "RefreshToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "RecoveryCode" ADD CONSTRAINT "RecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "StrayReport" ADD CONSTRAINT "StrayReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "StrayReportUpdate" ADD CONSTRAINT "StrayReportUpdate_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "StrayReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "LostPet" ADD CONSTRAINT "LostPet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PetForAdoption" ADD CONSTRAINT "PetForAdoption_shelterId_fkey" FOREIGN KEY ("shelterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "AdoptionApplication" ADD CONSTRAINT "AdoptionApplication_petId_fkey" FOREIGN KEY ("petId") REFERENCES "PetForAdoption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "AdoptionApplication" ADD CONSTRAINT "AdoptionApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ApplicationHomeCheck" ADD CONSTRAINT "ApplicationHomeCheck_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdoptionApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ApplicationAudit" ADD CONSTRAINT "ApplicationAudit_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdoptionApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PetFriendlySpot" ADD CONSTRAINT "PetFriendlySpot_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SpotVote" ADD CONSTRAINT "SpotVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SpotVote" ADD CONSTRAINT "SpotVote_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "PetFriendlySpot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PoisonAlert" ADD CONSTRAINT "PoisonAlert_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DailyStreak" ADD CONSTRAINT "DailyStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
