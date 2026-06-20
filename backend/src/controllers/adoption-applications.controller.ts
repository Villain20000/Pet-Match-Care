import { Request, Response } from 'express';
import { z } from 'zod';
import { AdoptionStatus } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { throwHttp } from "@/middlewares/error";
import {
  transitionApplicationWithNotification,
} from '@/services/adoption-application.service';
import { evaluateBadges } from '@/services/badges.engine';

const CreateDraftSchema = z.object({
  petId: z.string().uuid(),
  motivation: z.string().min(10).max(2000),
  homeEnvironment: z.object({
    hasYard: z.boolean(),
    hasKids: z.boolean(),
    hasOtherPets: z.boolean(),
    hoursAlone: z.number().min(0).max(24),
  }),
  questionnaire: z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])),
});

const TransitionSchema = z.object({
  to: z.nativeEnum(AdoptionStatus),
  note: z.string().max(500).optional(),
  lastKnownUpdatedAt: z.string().datetime().optional(),
});

const ScheduleHomeCheckSchema = z.object({
  scheduledAt: z.string().datetime(),
  inspectorName: z.string().min(2).max(120),
  inspectorNotes: z.string().max(1000).optional(),
});

/**
 * Create or update a draft application. We use findFirst + create|update
 * with a compound unique index on (petId, applicantId) so each citizen
 * has at most one application per pet. The previous upsert path failed
 * because Prisma requires an existing row when the `where` uses a
 * non-PK unique column.
 */
export const createOrUpdateDraft = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const input = CreateDraftSchema.parse(req.body);

  const pet = await prisma.petForAdoption.findUnique({ where: { id: input.petId } });
  if (!pet) throwHttp(req, 404, 'NOT_FOUND');

  const app = await prisma.$transaction(async (tx) => {
    const existing = await tx.adoptionApplication.findFirst({
      where: { petId: input.petId, applicantId: req.user!.sub },
    });

    if (existing) {
      if (existing.state !== 'DRAFT' && existing.state !== 'REJECTED' && existing.state !== 'CLOSED') {
        throwHttp(req, 
          409,
          'APPLICATION_EXISTS',
          'Έχεις ήδη ενεργή αίτηση για αυτό το ζώο',
        );
      }
      return tx.adoptionApplication.update({
        where: { id: existing.id },
        data: {
          motivation: input.motivation,
          homeEnvironment: input.homeEnvironment as any,
          questionnaire: input.questionnaire as any,
          state: 'DRAFT',
        },
      });
    }

    return tx.adoptionApplication.create({
      data: {
        petId: input.petId,
        applicantId: req.user!.sub,
        shelterId: pet.shelterId,
        motivation: input.motivation,
        homeEnvironment: input.homeEnvironment as any,
        questionnaire: input.questionnaire as any,
        state: 'DRAFT',
      },
    });
  });

  await evaluateBadges(req.user.sub);
  return res.status(201).json({ success: true, application: app });
};

export const transition = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const id = z.string().uuid().parse(req.params.id);
  const input = TransitionSchema.parse(req.body);

  const updated = await transitionApplicationWithNotification({
    applicationId: id,
    actorId: req.user.sub,
    actorRole: req.user.role,
    to: input.to,
    note: input.note,
    lastKnownUpdatedAt: input.lastKnownUpdatedAt,
  });
  return res.json({ success: true, application: updated });
};

export const scheduleHomeCheck = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  if (req.user.role !== 'SHELTER_ADMIN' && req.user.role !== 'PLATFORM_ADMIN') {
    throwHttp(req, 403, 'FORBIDDEN');
  }
  const id = z.string().uuid().parse(req.params.id);
  const input = ScheduleHomeCheckSchema.parse(req.body);

  const app = await prisma.adoptionApplication.update({
    where: { id },
    data: {
      state: 'HOME_CHECK_SCHEDULED',
      homeCheck: {
        upsert: {
          create: {
            scheduledAt: new Date(input.scheduledAt),
            inspectorName: input.inspectorName,
            inspectorNotes: input.inspectorNotes ?? null,
          },
          update: {
            scheduledAt: new Date(input.scheduledAt),
            inspectorName: input.inspectorName,
            inspectorNotes: input.inspectorNotes ?? null,
          },
        },
      },
      audit: {
        create: {
          actorId: req.user.sub,
          fromState: 'SCREENING',
          toState: 'HOME_CHECK_SCHEDULED',
          note: `Home check on ${input.scheduledAt}`,
        },
      },
    },
  });
  return res.json({ success: true, application: app });
};

export const getApplication = async (req: Request, res: Response) => {
  const id = z.string().uuid().parse(req.params.id);
  const app = await prisma.adoptionApplication.findUnique({
    where: { id },
    include: {
      homeCheck: true,
      audit: { orderBy: { createdAt: 'desc' } },
      pet: { select: { id: true, name: true, imageUrl: true, species: true } },
    },
  });
  if (!app) throwHttp(req, 404, 'NOT_FOUND');
  return res.json({ application: app });
};

export const listMine = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const apps = await prisma.adoptionApplication.findMany({
    where: { applicantId: req.user.sub },
    orderBy: { createdAt: 'desc' },
    include: { pet: { select: { id: true, name: true, imageUrl: true } } },
  });
  return res.json({ count: apps.length, applications: apps });
};

export const listForShelter = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const apps = await prisma.adoptionApplication.findMany({
    where: {
      state: { in: ['SUBMITTED', 'SCREENING', 'HOME_CHECK_SCHEDULED'] },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      applicant: { select: { id: true, fullName: true, karmaPoints: true } },
      pet: { select: { id: true, name: true, imageUrl: true } },
    },
    take: 80,
  });
  return res.json({ count: apps.length, applications: apps });
};

export { TRANSITIONS } from '@/services/adoption-application.service';
