import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { streakStatus, streakToday } from '@/controllers/streaks.controller';

export const streaksRouter = Router();
streaksRouter.post('/check-in', requireAuth, asyncHandler(streakToday));
streaksRouter.get('/me', requireAuth, asyncHandler(streakStatus));
