import { Router } from 'express';
import { optionalAuth, requireAuth } from '@/middlewares/auth';
import {
  createSpot,
  flagSpot,
  listSpots,
  voteOnSpot,
} from '@/controllers/spots.controller';

export const spotsRouter = Router();

spotsRouter.get('/', optionalAuth, listSpots);
spotsRouter.post('/', requireAuth, createSpot);
spotsRouter.post('/:id/vote', requireAuth, voteOnSpot);
spotsRouter.post('/:id/flag', requireAuth, flagSpot);
