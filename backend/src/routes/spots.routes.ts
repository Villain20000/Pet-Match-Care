import { Router } from 'express';
import { optionalAuth, requireAuth } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/asyncHandler';
import {
  createSpot,
  flagSpot,
  listSpots,
  voteOnSpot,
} from '@/controllers/spots.controller';

export const spotsRouter = Router();

spotsRouter.get('/', optionalAuth, asyncHandler(listSpots));
spotsRouter.post('/', requireAuth, asyncHandler(createSpot));
spotsRouter.post('/:id/vote', requireAuth, asyncHandler(voteOnSpot));
spotsRouter.post('/:id/flag', requireAuth, asyncHandler(flagSpot));
