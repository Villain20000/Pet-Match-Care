import { prisma } from '@/config/prisma';
import { createNotification } from './notifications.service';

const ymd = (d: Date): string => {
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${d.getUTCDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Idempotent: calling checkIn() twice on the same UTC day is a no-op.
 * Returns the new length of the user's current streak.
 */
export const checkIn = async (userId: string): Promise<{ streak: number; isNewDay: boolean }> => {
  const today = new Date();
  const todayYmd = ymd(today);

  const existingToday = await prisma.dailyStreak.findUnique({
    where: { userId_date: { userId, date: new Date(todayYmd) } },
  });
  if (existingToday) {
    return { streak: await currentStreakLength(userId), isNewDay: false };
  }

  await prisma.dailyStreak.create({
    data: { userId, date: new Date(todayYmd) },
  });

  // Award +5 karma and refresh streak / notify.
  const streak = await currentStreakLength(userId);
  await prisma.user.update({
    where: { id: userId },
    data: { karmaPoints: { increment: 5 } },
  });

  if (streak % 7 === 0) {
    await createNotification({
      userId,
      kind: 'STREAK_REMINDER',
      title: `🔥 ${streak} μέρες σερί!`,
      body: 'Συνέχισε έτσι — κέρδισες ένα bonus ορόσημο σερί.',
      data: { streakDays: streak },
    });
  }

  return { streak, isNewDay: true };
};

export const currentStreakLength = async (userId: string): Promise<number> => {
  const rows = await prisma.dailyStreak.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 60,
  });
  if (rows.length === 0) return 0;
  let streak = 1;
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1]!.date as Date;
    const cur = rows[i]!.date as Date;
    const diff = Math.round((prev.getTime() - cur.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) continue;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
};
