/**
 * Client-side DTOs mirror the backend's serializer shape exactly.
 *
 * Enums (Role, BadgeRarity, AdoptionStatus) are redeclared here as string
 * literal types to avoid a mobile → @prisma/client dependency. Keep these
 * in sync with `backend/prisma/schema.prisma` — `npm run test:catalog`
 * covers the locales side; for enums, treat any schema drift as a manual
 * review of this file.
 */

export type Locale = 'el' | 'en';

export type Role =
  | 'CITIZEN'
  | 'VOLUNTEER'
  | 'MUNICIPAL_WORKER'
  | 'SHELTER_ADMIN'
  | 'PLATFORM_ADMIN';

export type BadgeRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type AdoptionStatus =
  | 'AVAILABLE'
  | 'ADOPTED'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'SCREENING'
  | 'HOME_CHECK_SCHEDULED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ADOPTION_COMPLETED'
  | 'CLOSED';

export type Species = 'DOG' | 'CAT' | 'OTHER';

export interface ShelterLiteDto {
  id: string;
  name: string | null;
  city?: string | null;
  phone?: string | null;
}

export interface PetForAdoptionDto {
  id: string;
  shelterId: string;
  name: string;
  species: Species;
  age: string;
  size: string;
  description: string;
  imageUrl: string;
  isUrgent: boolean;
  status: AdoptionStatus;
  isMicrochipped: boolean;
  microchipNumber: string | null;
  isVaccinated: boolean;
  isSterilized: boolean;
  healthNotes: string | null;
  createdAt: string;
  shelter?: ShelterLiteDto | null;
}

export interface UserDto {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: Role;
  karmaPoints: number;
  emailVerifiedAt: string | null;
  totpEnabled: boolean;
  pushToken: string | null;
  locale: Locale;
}

export interface BadgeDto {
  id: string;
  code: string;
  name: string;
  description: string;
  iconEmoji: string;
  rarity: BadgeRarity;
}

export interface LostPetDto {
  id: string;
  name: string;
  species: 'DOG' | 'CAT' | 'OTHER';
  breed: string | null;
  description: string;
  imageUrl: string;
  lastSeenAt: string;
  lastSeenLat: number;
  lastSeenLng: number;
  addressHint: string | null;
  reward: string | null;
  isFound: boolean;
}

export interface ApplicationAuditDto {
  id: string;
  fromState: AdoptionStatus;
  toState: AdoptionStatus;
  note: string | null;
  createdAt: string;
}

export interface AdoptionApplicationDto {
  id: string;
  petId: string;
  applicantId: string;
  state: AdoptionStatus;
  motivation: string;
  updatedAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
  closedAt: string | null;
  homeCheck: {
    scheduledAt: string;
    inspectorName: string;
    inspectorNotes: string | null;
    passed: boolean | null;
  } | null;
  audit: ApplicationAuditDto[];
}

export interface NotificationDto {
  id: string;
  kind: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

// Keep the legacy MEDICAL / STERILIZATION / LOST / SCARE values until the
// backend's `ReportCondition` enum is extended to surface them. Without
// this widening we would silently collapse user-selected categories onto
// `STABLE`. The canonical Prisma enum check lives in the backend layer;
// until the migration ships, treat these tags as pending deprecation.
export type ReportCondition =
  | 'STABLE'
  | 'INJURED'
  | 'CRITICAL'
  | 'DECEASED'
  | 'MEDICAL'
  | 'STERILIZATION'
  | 'LOST'
  | 'SCARE';
export type ReportStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'EXPIRED';

export interface MunicipalityDto {
  name: string;
  latitude: number;
  longitude: number;
}

export interface StrayReportDto {
  id: string;
  reporterId: string;
  imageUrl: string;
  condition: ReportCondition;
  description: string | null;
  latitude: number;
  longitude: number;
  addressHint: string | null;
  status: ReportStatus;
  assignedMunicipality: string;
  createdAt: string;
}

export type SpotCategory =
  | 'PARK'
  | 'BEACH'
  | 'CAFE'
  | 'VET'
  | 'PET_STORE'
  | 'TRAIL'
  | 'URBAN'
  | 'OTHER'
  | 'APARTMENT';

export interface PetFriendlySpotDto {
  id: string;
  creatorId: string;
  name: string;
  category: SpotCategory;
  latitude: number;
  longitude: number;
  address: string | null;
  upvotes: number;
  downvotes: number;
  isVerified: boolean;
  isFlagged: boolean;
  flagReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PoisonSeverity = 'HIGH' | 'CRITICAL';

export interface PoisonAlertDto {
  id: string;
  reporterId: string;
  latitude: number;
  longitude: number;
  addressHint: string | null;
  description: string | null;
  severity: PoisonSeverity;
  createdAt: string;
  expiresAt: string;
}
