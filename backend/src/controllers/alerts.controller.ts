/**
 * Poison Alert (Φόλες) controller.
 *
 * Responsibilities:
 *   1. Persist a poison report submitted by a citizen.
 *   2. Compute expiresAt = createdAt + POISON_ALERT_TTL_HOURS (default 48).
 *   3. Find every user whose home coordinates fall within
 *      POISON_ALERT_RADIUS_KM (default 2 km) — using a bounding-box
 *      pre-filter on the database then haversine refinement in memory.
 *   4. Send a HIGH-priority Firebase Cloud Messaging push to every matched
 *      user's pushToken (Android: priority "high" + MAX + custom sound).
 *   5. Update the citizen's karmaPoints (+50 for protecting the community).
 */
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@/config/prisma';
import { env } from '@/config/env';
import { boundingBox, haversineKm } from '@/services/geo.service';
import {
  sendPoisonAlertPush,
  sendPoisonAlertPushToMany,
} from '@/services/fcm.service';
import { throwHttp } from '@/utils/http';

const toRad = (deg: number) => (deg * Math.PI) / 180;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const CreatePoisonAlertSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  addressHint: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  severity: z.enum(['HIGH', 'CRITICAL']).default('HIGH'),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const KARMA_REWARD = 50;

const serializePoisonAlert = (alert: {
  id: string;
  latitude: number;
  longitude: number;
  addressHint: string | null;
  description: string | null;
  severity: string;
  createdAt: Date;
  expiresAt: Date;
  reporterId: string;
}) => ({
  id: alert.id,
  latitude: alert.latitude,
  longitude: alert.longitude,
  addressHint: alert.addressHint,
  description: alert.description,
  severity: alert.severity,
  createdAt: alert.createdAt.toISOString(),
  expiresAt: alert.expiresAt.toISOString(),
  reporterId: alert.reporterId,
});

// ---------------------------------------------------------------------------
// POST /api/alerts/poison
// ---------------------------------------------------------------------------
export const createPoisonAlert = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');

  const input = CreatePoisonAlertSchema.parse(req.body);

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + env.POISON_ALERT_TTL_HOURS * 60 * 60 * 1000,
  );

  // 1) Persist the alert ---------------------------------------------------
  const alert = await prisma.poisonAlert.create({
    data: {
      reporterId: req.user.sub,
      latitude: input.latitude,
      longitude: input.longitude,
      addressHint: input.addressHint ?? null,
      description: input.description ?? null,
      severity: input.severity,
      createdAt: now,
      expiresAt,
    },
  });

  // 2) Reward the reporter ------------------------------------------------
  await prisma.user.update({
    where: { id: req.user.sub },
    data: { karmaPoints: { increment: KARMA_REWARD } },
  });

  // 3) Geofence: find users within POISON_ALERT_RADIUS_KM -----------------
  const box = boundingBox(input.latitude, input.longitude, env.POISON_ALERT_RADIUS_KM);

  const candidates = await prisma.user.findMany({
    where: {
      pushToken: { not: null },
      homeLatitude: { gte: box.minLat, lte: box.maxLat },
      homeLongitude: { gte: box.minLng, lte: box.maxLng },
      // Don't re-notify the reporter themselves.
      NOT: { id: req.user.sub },
    },
    select: {
      id: true,
      pushToken: true,
      homeLatitude: true,
      homeLongitude: true,
    },
  });

  const radiusKm = env.POISON_ALERT_RADIUS_KM;
  const inRange = candidates.filter(
    (u) =>
      u.homeLatitude !== null &&
      u.homeLongitude !== null &&
      haversineKm(input.latitude, input.longitude, u.homeLatitude, u.homeLongitude) <=
        radiusKm,
  );

  const tokens = inRange
    .map((u) => u.pushToken)
    .filter((t): t is string => typeof t === 'string' && t.length > 0);

  // 4) Push notification fan-out ------------------------------------------
  const pushPayload = {
    alertId: alert.id,
    latitude: alert.latitude,
    longitude: alert.longitude,
    addressHint: alert.addressHint ?? undefined,
    description: alert.description ?? undefined,
    distanceKm: 0,
  };

  const pushStats = await sendPoisonAlertPushToMany(tokens, pushPayload);

  return res.status(201).json({
    success: true,
    alert: serializePoisonAlert(alert),
    geofence: {
      radiusKm: env.POISON_ALERT_RADIUS_KM,
      usersInRange: inRange.length,
      tokensNotified: tokens.length,
    },
    push: pushStats,
    rewarded: { karma: KARMA_REWARD },
  });
};

// ---------------------------------------------------------------------------
// GET /api/alerts/poison/active?lat=&lng=&radius=
// ---------------------------------------------------------------------------
export const getActivePoisonAlerts = async (req: Request, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusKm = Number(req.query.radius ?? env.POISON_ALERT_RADIUS_KM);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throwHttp(req, 400, 'GEO_BAD_PARAMS');
  }

  const box = boundingBox(lat, lng, radiusKm);
  const now = new Date();

  const candidates = await prisma.poisonAlert.findMany({
    where: {
      expiresAt: { gt: now },
      latitude: { gte: box.minLat, lte: box.maxLat },
      longitude: { gte: box.minLng, lte: box.maxLng },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const inRange = candidates
    .map((a) => ({
      ...a,
      distanceKm: haversineKm(lat, lng, a.latitude, a.longitude),
    }))
    .filter((a) => a.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 100);

  return res.json({
    count: inRange.length,
    radiusKm,
    alerts: inRange.map(serializePoisonAlert),
  });
};

// ---------------------------------------------------------------------------
// POST /api/alerts/poison/:id/test-push
// ---------------------------------------------------------------------------
export const resendPoisonAlertPush = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');

  const alertId = z.string().uuid().parse(req.params.id);

  const [alert, user] = await Promise.all([
    prisma.poisonAlert.findUnique({ where: { id: alertId } }),
    prisma.user.findUnique({ where: { id: req.user.sub } }),
  ]);

  if (!alert) throwHttp(req, 404, 'ALERT_NOT_FOUND');
  if (!user?.homeLatitude || !user.homeLongitude) {
    throwHttp(req, 400, 'HOME_LOCATION_REQUIRED_FOR_TEST');
  }
  const distanceKm = haversineKm(
    user.homeLatitude!,
    user.homeLongitude!,
    alert.latitude,
    alert.longitude,
  );
  if (!user.pushToken) throwHttp(req, 400, 'NO_PUSH_TOKEN');

  const result = await sendPoisonAlertPush(user.pushToken, {
    alertId: alert.id,
    latitude: alert.latitude,
    longitude: alert.longitude,
    addressHint: alert.addressHint ?? undefined,
    description: alert.description ?? undefined,
    distanceKm,
  });

  return res.json({ ok: result.ok, dryRun: result.dryRun, distanceKm });
};
