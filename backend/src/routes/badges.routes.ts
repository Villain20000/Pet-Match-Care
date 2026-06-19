import { Router } from 'express';
import { listAll, listByMunicipality, listMine } from '@/controllers/badges.controller';
import { optionalAuth, requireAuth } from '@/middlewares/auth';

export const badgesRouter = Router();
badgesRouter.get('/', optionalAuth, listAll);
badgesRouter.get('/mine', requireAuth, listMine);
badgesRouter.get('/leaderboard/municipality', optionalAuth, listByMunicipality);
