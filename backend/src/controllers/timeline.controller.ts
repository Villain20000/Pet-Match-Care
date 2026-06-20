import { Request, Response } from 'express';
import { z } from 'zod';
import { ReportStatus } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { throwHttp } from "@/middlewares/error";
import { appendUpdate, listUpdates } from '@/services/timeline.service';
import { notifyMatchesForReport } from '@/controllers/lost-pets.controller';
import { findClosestMunicipality } from '@/services/municipality.service';

const CreateUpdateSchema = z.object({
  status: z.nativeEnum(ReportStatus),
  message: z.string().min(5).max(1000),
  photoUrl: z.string().url().optional(),
});

export const postUpdate = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const id = z.string().uuid().parse(req.params.id);
  const input = CreateUpdateSchema.parse(req.body);

  const update = await appendUpdate({
    reportId: id,
    authorId: req.user.sub,
    authorRole: req.user.role,
    status: input.status,
    message: input.message,
    photoUrl: input.photoUrl,
  });

  // Notify the reporter in-app.
  const report = await prisma.strayReport.findUnique({ where: { id } });
  if (report && report.reporterId !== req.user.sub) {
    await prisma.notification.create({
      data: {
        userId: report.reporterId,
        kind: 'STRAY_REPORT_UPDATE',
        title: 'Νέα ενημέρωση στην αναφορά σου',
        body: input.message,
        data: { reportId: id, status: input.status },
      },
    });
  }
  return res.status(201).json({ success: true, update });
};

export const getTimeline = async (req: Request, res: Response) => {
  const id = z.string().uuid().parse(req.params.id);
  const [updates, report] = await Promise.all([
    listUpdates(id),
    prisma.strayReport.findUnique({ where: { id: id } }),
  ]);
  if (!report) throwHttp(req, 404, 'NOT_FOUND');
  return res.json({ report, updates });
};

/**
 * POST /api/reports — re-export so we can wire lost-pet matching + 14-day
 * expiry into the same handler. Called by the versioned reports.routes
 * that points to this controller.
 */
export const createReportWithTimeline = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');

  const CreateSchema = z.object({
    imageUrl: z.string().url(),
    condition: z.nativeEnum(z.enum(['MEDICAL', 'STERILIZATION', 'LOST', 'SCARE'])),
    description: z.string().max(500).optional(),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    addressHint: z.string().max(200).optional(),
  });
  const input = CreateSchema.parse(req.body);

  const municipality = findClosestMunicipality(input.latitude, input.longitude);
  const expiresAt = new Date(
    Date.now() + (Number(process.env.STRAY_REPORT_TTL_DAYS) || 14) * 24 * 60 * 60 * 1000,
  );

  const report = await prisma.strayReport.create({
    data: {
      reporterId: req.user.sub,
      imageUrl: input.imageUrl,
      condition: input.condition,
      description: input.description ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      addressHint: input.addressHint ?? null,
      assignedMunicipality: municipality.name,
      assignedAt: new Date(),
      expiresAt,
      // First update = "OPEN" created.
      updates: {
        create: {
          authorId: req.user.sub,
          status: 'OPEN',
          message: 'Η αναφορά καταχωρήθηκε',
        },
      },
    },
  });

  await prisma.user.update({
    where: { id: req.user.sub },
    data: { karmaPoints: { increment: 10 } },
  });

  // Auto-match against lost-pet registry.
  let matches = 0;
  if (input.condition === 'LOST' || input.description?.toLowerCase().includes('χαμέν')) {
    matches = await notifyMatchesForReport({
      reportId: report.id,
      reporterId: req.user.sub,
      species: 'DOG',
      latitude: input.latitude,
      longitude: input.longitude,
      description: input.description ?? '',
    });
  }

  return res.status(201).json({ success: true, report, routedTo: municipality, lostPetMatches: matches });
};
