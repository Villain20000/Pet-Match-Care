/**
 * Runtime-valuable mirrors of every Prisma enum declared in
 * `backend/prisma/schema.prisma`.
 *
 * Why this file exists: Prisma v5 emits the PG enums as **type-only** TS
 * declarations. The compiler refuses `Species.DOG` even though the value
 * is unambiguous. Re-declaring each enum here (a) keeps the runtime API
 * ergonomic for service-layer code (e.g. `provider: AuthProvider.LOCAL`)
 * and (b) acts as a single-source-of-truth fallback should Prisma's
 * codegen strategy change in a future upgrade.
 *
 * Touch these together with the schema block, not separately.
 */

export const Role = {
  CITIZEN: 'CITIZEN',
  VOLUNTEER: 'VOLUNTEER',
  MUNICIPAL_WORKER: 'MUNICIPAL_WORKER',
  SHELTER_ADMIN: 'SHELTER_ADMIN',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const AuthProvider = {
  LOCAL: 'LOCAL',
  GOOGLE: 'GOOGLE',
} as const;
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

export const Species = {
  DOG: 'DOG',
  CAT: 'CAT',
  OTHER: 'OTHER',
} as const;
export type Species = (typeof Species)[keyof typeof Species];

export const AdoptionStatus = {
  AVAILABLE: 'AVAILABLE',
  ADOPTED: 'ADOPTED',
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  SCREENING: 'SCREENING',
  HOME_CHECK_SCHEDULED: 'HOME_CHECK_SCHEDULED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ADOPTION_COMPLETED: 'ADOPTION_COMPLETED',
  CLOSED: 'CLOSED',
} as const;
export type AdoptionStatus = (typeof AdoptionStatus)[keyof typeof AdoptionStatus];

export const ReportCondition = {
  STABLE: 'STABLE',
  INJURED: 'INJURED',
  CRITICAL: 'CRITICAL',
  DECEASED: 'DECEASED',
} as const;
export type ReportCondition = (typeof ReportCondition)[keyof typeof ReportCondition];

export const ReportStatus = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  EXPIRED: 'EXPIRED',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const BadgeRarity = {
  COMMON: 'COMMON',
  RARE: 'RARE',
  EPIC: 'EPIC',
  LEGENDARY: 'LEGENDARY',
} as const;
export type BadgeRarity = (typeof BadgeRarity)[keyof typeof BadgeRarity];

export const NotificationKind = {
  STREAK_REMINDER: 'STREAK_REMINDER',
  KARMA_REWARD: 'KARMA_REWARD',
  BADGE_UNLOCKED: 'BADGE_UNLOCKED',
  BADGE_EARNED: 'BADGE_EARNED',
  ADOPTION_UPDATE: 'ADOPTION_UPDATE',
  ADOPTION_STATUS_CHANGED: 'ADOPTION_STATUS_CHANGED',
  POISON_ALERT_NEARBY: 'POISON_ALERT_NEARBY',
  STRAY_REPORT_NEARBY: 'STRAY_REPORT_NEARBY',
  STRAY_REPORT_UPDATE: 'STRAY_REPORT_UPDATE',
  LOST_PET_MATCH: 'LOST_PET_MATCH',
  GENERAL: 'GENERAL',
} as const;
export type NotificationKind = (typeof NotificationKind)[keyof typeof NotificationKind];

export const SpotCategory = {
  PARK: 'PARK',
  BEACH: 'BEACH',
  CAFE: 'CAFE',
  VET: 'VET',
  PET_STORE: 'PET_STORE',
  TRAIL: 'TRAIL',
  URBAN: 'URBAN',
  OTHER: 'OTHER',
} as const;
export type SpotCategory = (typeof SpotCategory)[keyof typeof SpotCategory];

export const PoisonSeverity = {
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type PoisonSeverity = (typeof PoisonSeverity)[keyof typeof PoisonSeverity];
