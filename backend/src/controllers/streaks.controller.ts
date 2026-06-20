import { Request, Response } from 'express';
import { throwHttp } from "@/middlewares/error";
import { checkIn, currentStreakLength } from '@/services/streaks.service';

export const streakToday = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const result = await checkIn(req.user!.sub);
  return res.json({ streak: result.streak, newDay: result.isNewDay });
};

export const streakStatus = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const streak = await currentStreakLength(req.user!.sub);
  return res.json({ streak });
};
