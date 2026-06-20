import { Request, Response } from 'express';
import { z } from 'zod';
import { throwHttp } from "@/middlewares/error";
import {
  listNotifications,
  markAllRead,
  markRead,
  unreadCount,
} from '@/services/notifications.service';

export const inbox = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const take = Math.min(100, Number(req.query.take ?? 50));
  const items = await listNotifications(req.user!.sub, take);
  return res.json({ count: items.length, items });
};

export const unread = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  return res.json({ count: await unreadCount(req.user!.sub) });
};

export const mark = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const ids = z.array(z.string().uuid()).parse(req.body.ids ?? []);
  await markRead(req.user!.sub, ids);
  return res.json({ success: true });
};

export const markAll = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  await markAllRead(req.user!.sub);
  return res.json({ success: true });
};
