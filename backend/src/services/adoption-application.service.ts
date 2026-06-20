import { prisma } from '@/config/prisma';
import type { AdoptionStatus, Role } from '@prisma/client';
import { HttpError } from '@/utils/http';
import { createNotification } from './notifications.service';

/**
 * v2 state machine. Each transition declares which roles may perform it.
 *   DRAFT               → SUBMITTED                  : APPLICANT
 *   SUBMITTED           → SCREENING                  : SHELTER_ADMIN
 *   SCREENING           → HOME_CHECK_SCHEDULED       : SHELTER_ADMIN
 *   HOME_CHECK_SCHEDULED→ APPROVED | REJECTED        : SHELTER_ADMIN
 *   APPROVED            → ADOPTION_COMPLETED         : SHELTER_ADMIN | PLATFORM_ADMIN
 *   any                 → CLOSED                     : APPLICANT (cancel) | SHELTER_ADMIN (reject)
 */
export const TRANSITIONS: Record<AdoptionStatus, AdoptionStatus[]> = {
  AVAILABLE:           [],
  ADOPTED:             [],
  DRAFT:               ['SUBMITTED', 'CLOSED'],
  SUBMITTED:           ['SCREENING', 'CLOSED'],
  SCREENING:           ['HOME_CHECK_SCHEDULED', 'REJECTED', 'CLOSED'],
  HOME_CHECK_SCHEDULED:['APPROVED', 'REJECTED', 'CLOSED'],
  APPROVED:            ['ADOPTION_COMPLETED', 'CLOSED'],
  REJECTED:            ['CLOSED'],
  ADOPTION_COMPLETED:  [],
  CLOSED:              [],
};

const ROLE_OWNER: Record<AdoptionStatus, Role[]> = {
  AVAILABLE:            ['SHELTER_ADMIN', 'PLATFORM_ADMIN'],
  ADOPTED:              ['SHELTER_ADMIN', 'PLATFORM_ADMIN'],
  DRAFT:                ['CITIZEN'],
  SUBMITTED:            ['SHELTER_ADMIN', 'PLATFORM_ADMIN'],
  SCREENING:            ['SHELTER_ADMIN', 'PLATFORM_ADMIN'],
  HOME_CHECK_SCHEDULED: ['SHELTER_ADMIN', 'PLATFORM_ADMIN'],
  APPROVED:             ['SHELTER_ADMIN', 'PLATFORM_ADMIN'],
  REJECTED:             ['SHELTER_ADMIN', 'PLATFORM_ADMIN'],
  ADOPTION_COMPLETED:   ['SHELTER_ADMIN', 'PLATFORM_ADMIN'],
  CLOSED:               ['CITIZEN', 'SHELTER_ADMIN', 'PLATFORM_ADMIN'],
};

interface TransitionArgs {
  applicationId: string;
  actorId: string;
  actorRole: Role;
  to: AdoptionStatus;
  note?: string;
  /** Sent by the client to defeat concurrent state drift. */
  lastKnownUpdatedAt?: string;
}

export const transitionApplication = async (args: TransitionArgs) => {
  return prisma.$transaction(async (tx) => {
    const app = await tx.adoptionApplication.findUnique({
      where: { id: args.applicationId },
    });
    if (!app) throw new HttpError(404, 'APPLICATION_NOT_FOUND');

    const allowedRoles = ROLE_OWNER[app.state];
    if (!allowedRoles.includes(args.actorRole)) {
      throw new HttpError(403, 'BAD_GUARD_ROLE_APPLICATION');
    }
    if (!TRANSITIONS[app.state].includes(args.to)) {
      throw new HttpError(400, 'ILLEGAL_TRANSITION', {
        from: app.state,
        to: args.to,
      });
    }
    if (args.lastKnownUpdatedAt && args.lastKnownUpdatedAt !== app.updatedAt.toISOString()) {
      throw new HttpError(409, 'STALE_STATE');
    }

    const updated = await tx.adoptionApplication.update({
      where: { id: app.id },
      data: {
        state: args.to,
        submittedAt: args.to === 'SUBMITTED' ? new Date() : app.submittedAt,
        approvedAt: args.to === 'APPROVED' ? new Date() : app.approvedAt,
        closedAt: args.to === 'CLOSED' ? new Date() : app.closedAt,
      },
    });

    await tx.applicationAudit.create({
      data: {
        applicationId: app.id,
        actorId: args.actorId,
        fromState: app.state,
        toState: args.to,
        note: args.note ?? null,
      },
    });

    return updated;
  });
};

/** Wraps the transition + side-effects (in-app notification). */
export const transitionApplicationWithNotification = async (args: TransitionArgs) => {
  const updated = await transitionApplication(args);

  // Side-effects per transition
  if (updated.state === 'SUBMITTED') {
    await createNotification({
      userId: updated.applicantId,
      kind: 'ADOPTION_STATUS_CHANGED',
      title: '📨 Η αίτησή σου υποβλήθηκε',
      body: 'Η φιλοζωική θα την εξετάσει σύντομα.',
      data: { applicationId: updated.id },
    });
  }
  if (updated.state === 'APPROVED') {
    await createNotification({
      userId: updated.applicantId,
      kind: 'ADOPTION_STATUS_CHANGED',
      title: '🎉 Η αίτησή σου εγκρίθηκε!',
      body: 'Επικοινώνησε με τη φιλοζωική για τα επόμενα βήματα.',
      data: { applicationId: updated.id },
    });
  }
  if (updated.state === 'REJECTED') {
    await createNotification({
      userId: updated.applicantId,
      kind: 'ADOPTION_STATUS_CHANGED',
      title: 'Δυστυχώς, η αίτηση απορρίφθηκε',
      body: 'Μην πτοείσαι — υπάρχουν πολλά ακόμη ζωάκια που σε περιμένουν.',
      data: { applicationId: updated.id },
    });
  }

  return updated;
};
