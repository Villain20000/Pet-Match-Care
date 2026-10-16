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

// --- v2 platform DTOs (challenges, forum, donations, foster, chat, tags) ---

export interface ChallengeDto {
  id: string;
  title: string;
  description: string;
  karmaReward: number;
  targetCount: number;
  kind: string;
  expiresAt: string;
}

export interface CommunityPostDto {
  id: string;
  authorId: string;
  title: string;
  body: string;
  category: string;
  upvotes: number;
  createdAt: string;
  author?: { id: string; fullName: string | null; avatarUrl: string | null } | null;
  comments?: unknown[];
}

export interface DonationCampaignDto {
  id: string;
  shelterId: string;
  title: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  neededItems: string | null;
  isEmergency: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedingStationDto {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  lastRefilled: string | null;
  refillNotes: string | null;
  createdAt: string;
}

export interface FosterProfileDto {
  id: string;
  userId: string;
  isAvailable: boolean;
  city: string;
  maxPets: number;
  preferredSpecies: Species;
  hasGarden: boolean;
  hasOtherPets: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; fullName: string | null; avatarUrl: string | null; role: Role } | null;
}

export interface ChatUserLite {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface ChatMessageDto {
  id: string;
  roomId: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender?: ChatUserLite | null;
}

export interface ChatRoomDto {
  id: string;
  topic: string | null;
  createdAt: string;
  updatedAt: string;
  participants?: { id: string; roomId: string; userId: string; user?: ChatUserLite & { role: Role } | null }[];
  messages?: ChatMessageDto[];
}

export interface PetTagDto {
  id: string;
  code: string;
  ownerId: string;
  petName: string;
  species: Species;
  contactPhone: string;
  medicalNotes: string | null;
  isLost: boolean;
  createdAt: string;
}

export interface MedicalRecordDto {
  id: string;
  petId: string;
  recordType: string;
  title: string;
  description: string | null;
  performedAt: string;
  vetName: string | null;
  nextDueDate: string | null;
  createdAt: string;
}

export interface MatchmakerResultDto {
  matchScore: number;
  suggestedSpecies: string;
  recommendedPets: PetForAdoptionDto[];
}
