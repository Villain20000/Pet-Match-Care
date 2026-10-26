import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma, ReportCondition, ReportStatus } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { throwHttp } from "@/utils/http";
import { findClosestMunicipality } from '@/services/municipality.service';
import { boundingBox, haversineKm, fuzzCoordinates } from '@/services/geo.service';
import { calculateSlaTarget } from '@/services/sla.service';

const KARMA_PER_REPORT = 10;

const CreateReportSchema = z.object({
  imageUrl: z.string().url('Μη έγκυρο URL εικόνας'),
  condition: z.nativeEnum(ReportCondition),
  description: z.string().max(500).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  addressHint: z.string().max(200).optional(),
});

const NearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(50).default(5), // km
});

// Accept the full Prisma row and fuzz coordinates unless user is authorized
const serializeReport = (
  r: Prisma.StrayReportGetPayload<{}>,
  user?: { sub: string; role: string },
) => {
  const isAuthorizedWorker =
    user?.role === 'MUNICIPAL_WORKER' ||
    user?.role === 'SHELTER_ADMIN' ||
    user?.role === 'PLATFORM_ADMIN' ||
    user?.sub === r.reporterId;

  const coords = isAuthorizedWorker
    ? { latitude: r.latitude, longitude: r.longitude }
    : fuzzCoordinates(r.latitude, r.longitude, r.id);

  return {
    id: r.id,
    reporterId: r.reporterId,
    imageUrl: r.imageUrl,
    condition: r.condition,
    description: r.description,
    latitude: coords.latitude,
    longitude: coords.longitude,
    isFuzzed: !isAuthorizedWorker,
    addressHint: r.addressHint,
    status: r.status,
    assignedMunicipality: r.assignedMunicipality,
    createdAt: r.createdAt.toISOString(),
  };
};

export const createReport = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');

  const input = CreateReportSchema.parse(req.body);

  // Auto-assign to closest Greek municipality.
  const municipality = findClosestMunicipality(input.latitude, input.longitude);

  const now = new Date();
  const slaTargetAt = calculateSlaTarget(input.condition, now);

  const report = await prisma.strayReport.create({
    data: {
      reporterId: req.user!.sub,
      imageUrl: input.imageUrl,
      condition: input.condition,
      description: input.description ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      addressHint: input.addressHint ?? null,
      assignedMunicipality: municipality.name,
      assignedAt: now,
      slaTargetAt,
      slaStatus: 'ON_TIME',
      status: ReportStatus.OPEN,
    },
  });

  await prisma.user.update({
    where: { id: req.user!.sub },
    data: { karmaPoints: { increment: KARMA_PER_REPORT } },
  });

  return res.status(201).json({
    success: true,
    report: serializeReport(report, req.user),
    routedTo: municipality,
    rewarded: { karma: KARMA_PER_REPORT },
  });
};

export const listNearbyReports = async (req: Request, res: Response) => {
  const { lat, lng, radius } = NearbyQuerySchema.parse(req.query);

  const box = boundingBox(lat, lng, radius);
  const candidates = await prisma.strayReport.findMany({
    where: {
      status: { in: [ReportStatus.OPEN, ReportStatus.IN_PROGRESS] },
      latitude: { gte: box.minLat, lte: box.maxLat },
      longitude: { gte: box.minLng, lte: box.maxLng },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const enriched = candidates
    .map((r) => ({
      ...r,
      distanceKm: haversineKm(lat, lng, r.latitude, r.longitude),
    }))
    .filter((r) => r.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 80);

  return res.json({
    count: enriched.length,
    radiusKm: radius,
    reports: enriched.map((r) => serializeReport(r, req.user)),
  });
};

export const getReportById = async (req: Request, res: Response) => {
  const id = z.string().uuid().parse(req.params.id);
  const report = await prisma.strayReport.findUnique({ where: { id } });
  if (!report) throwHttp(req, 404, 'NOT_FOUND');
  return res.json({ report: serializeReport(report!, req.user) });
};

// Worker-only: mark a report IN_PROGRESS or RESOLVED.
export const updateReportStatus = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');

  const id = z.string().uuid().parse(req.params.id);
  const status = z.nativeEnum(ReportStatus).parse(req.body.status);

  const report = await prisma.strayReport.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === ReportStatus.RESOLVED ? new Date() : null,
    },
  });

  return res.json({ success: true, report: serializeReport(report, req.user) });
};
