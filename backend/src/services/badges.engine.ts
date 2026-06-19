import { prisma } from '@/config/prisma';
import { createNotification } from './notifications.service';

interface Predicate {
  kind:
    | 'REPORTS_CREATED'
    | 'POISONS_REPORTED'
    | 'SPOTS_VERIFIED'
    | 'ADOPTIONS_COMPLETED'
    | 'KARMA_REACHED'
    | 'STREAK_REACHED';
  threshold: number;
}

/**
 * Evaluates unmet badges for the user and awards any whose predicates
 * fire. Idempotent — running this many times in a row never duplicates.
 */
export const evaluateBadges = async (userId: string): Promise<string[]> => {
  // 1. Pull user stats in one round trip.
  const [user, reports, poisons, adopted, streak] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { karmaPoints: true } }),
    prisma.strayReport.count({ where: { reporterId: userId } }),
    prisma.poisonAlert.count({ where: { reporterId: userId } }),
    prisma.adoptionApplication.count({
      where: { applicantId: userId, state: 'ADOPTION_COMPLETED' },
    }),
    prisma.dailyStreak.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 1,
      select: { date: true },
    }),
  ]);

  const lastStreakDate = streak[0]?.date;
  const streakDays = lastStreakDate
    ? Math.min(
        30,
        Math.floor((Date.now() - new Date(lastStreakDate).getTime()) / (1000 * 60 * 60 * 24)) === 0
          ? 1
          : 30,
      )
    : 0;

  const stats: Record<Predicate['kind'], number> = {
    REPORTS_CREATED: reports,
    POISONS_REPORTED: poisons,
    SPOTS_VERIFIED: 0, // computed separately if needed
    ADOPTIONS_COMPLETED: adopted,
    KARMA_REACHED: user.karmaPoints,
    STREAK_REACHED: streakDays,
  };

  // 2. Determine already-awarded badges to avoid duplication.
  const alreadyAwarded = new Set(
    (await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    })).map((b) => b.badgeId),
  );

  // 3. Compare against every badge.
  const allBadges = await prisma.badge.findMany();
  const newly: string[] = [];

  for (const badge of allBadges) {
    if (alreadyAwarded.has(badge.id)) continue;
    const p = badge.predicate as unknown as Predicate;
    if (!p?.kind) continue;
    if ((stats[p.kind] ?? 0) >= p.threshold) {
      await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
      newly.push(badge.id);
      await createNotification({
        userId,
        kind: 'BADGE_EARNED',
        title: `🏅 ${badge.name}`,
        body: `${badge.description}`,
        data: { badgeId: badge.id, code: badge.code },
      });
    }
  }
  return newly;
};
