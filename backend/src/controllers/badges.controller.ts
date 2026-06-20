import { Request, Response } from 'express';
import { prisma } from '@/config/prisma';
import { throwHttp } from "@/middlewares/error";
import { evaluateBadges } from '@/services/badges.engine';

export const listAll = async (_req: Request, res: Response) => {
  const badges = await prisma.badge.findMany({ orderBy: { rarity: 'asc' } });
  return res.json({ count: badges.length, badges });
};

export const listMine = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const userId = req.user.sub;

  // Re-evaluate before responding so recent activity unlocks badges
  // without requiring the client to ping /re-evaluate.
  await evaluateBadges(userId);

  const mine = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { awardedAt: 'desc' },
  });
  return res.json({
    count: mine.length,
    badges: mine.map((rb) => rb.badge),
  });
};

export const listByMunicipality = async (req: Request, res: Response) => {
  const municipality = (req.query.municipality as string) ?? '';
  if (!municipality) throwHttp(req, 400, 'VALIDATION_ERROR');

  // Approximation: count karma earned by users whose stray reports were
  // routed to that municipality (proud-of-citizens-by-dimos).
  const grouped = await prisma.strayReport.groupBy({
    by: ['reporterId'],
    where: { assignedMunicipality: municipality },
    _count: { _all: true },
  });
  const reporterIds = grouped.map((g) => g.reporterId);
  const users = await prisma.user.findMany({
    where: { id: { in: reporterIds } },
    select: { id: true, fullName: true, karmaPoints: true, avatarUrl: true },
  });
  const merged = users
    .map((u) => ({
      user: u,
      reports: grouped.find((g) => g.reporterId === u.id)?._count._all ?? 0,
    }))
    .sort((a, b) => b.user.karmaPoints - a.user.karmaPoints)
    .slice(0, 50);

  return res.json({ municipality, count: merged.length, leaderboard: merged });
};
