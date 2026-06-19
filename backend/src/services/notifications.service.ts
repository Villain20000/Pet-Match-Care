import { prisma } from '@/config/prisma';
import type { NotificationKind } from '@prisma/client';

interface CreateArgs {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export const createNotification = async (args: CreateArgs) => {
  return prisma.notification.create({
    data: {
      userId: args.userId,
      kind: args.kind,
      title: args.title,
      body: args.body,
      data: (args.data ?? {}) as any,
    },
  });
};

export const listNotifications = (userId: string, take = 50) =>
  prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take,
  });

export const markRead = (userId: string, ids: string[]) =>
  prisma.notification.updateMany({
    where: { userId, id: { in: ids }, readAt: null },
    data: { readAt: new Date() },
  });

export const unreadCount = (userId: string) =>
  prisma.notification.count({ where: { userId, readAt: null } });

export const markAllRead = (userId: string) =>
  prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
