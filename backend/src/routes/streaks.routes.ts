import { Router } from 'express';
import { streakStatus, streakToday } from '@/controllers/streaks.controller';
import { requireAuth } from '@/middlewares/auth';

export const streaksRouter = Router();
streaksRouter.post('/check-in', requireAuth, streakToday);
streaksRouter.get('/me', requireAuth, streakStatus);
