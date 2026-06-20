/**
 * Server-side DTOs that the mobile client imports. Mirrors the Prisma
 * shapes we actually serialize.
 *
 * Also re-exports the runtime-valuable enum mirrors from `./enums` so
 * services can pull both runtime constants and types from a single
 * `@/types` import — no need to fall through to `@prisma/client` for
 * one and the local mirror for the other.
 *
 * NOTE: `export * from './enums'` propagates both the runtime consts and
 * the type aliases defined there, since `enums.ts` declares them on the
 * SAME identifier (e.g. `export const Role = ...` + `export type Role =
 * ...`). That makes the type-side accessible to downstream consumers
 * without an extra `export type` line here. The Prisma-derived types
 * below are imported locally-only for the DTO interface declarations
 * — we rely on them purely for the *structural* compatibility check
 * (they should match `enums.ts` exactly).
 */
import type { AdoptionStatus, BadgeRarity, Role } from '@prisma/client';

export * from './enums';

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
  locale: 'el' | 'en';
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
