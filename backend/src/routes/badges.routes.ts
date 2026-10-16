import { Router } from 'express';
import { listAll, listByMunicipality, listMine } from '@/controllers/badges.controller';
import { optionalAuth, requireAuth } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/asyncHandler';

export const badgesRouter = Router();
badgesRouter.get('/', optionalAuth, asyncHandler(listAll));
badgesRouter.get('/mine', requireAuth, asyncHandler(listMine));
badgesRouter.get(
  '/leaderboard/municipality',
  optionalAuth,
  asyncHandler(listByMunicipality),
);
