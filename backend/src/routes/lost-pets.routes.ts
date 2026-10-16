import { Router, type NextFunction, type Request, type Response } from 'express';
import { requireAuth } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/asyncHandler';
import {
  createLostPet,
  findMatchesForReport,
  listLostPets,
  markFound,
} from '@/controllers/lost-pets.controller';

export const lostPetsRouter = Router();

lostPetsRouter.get('/', optionalAuth, asyncHandler(listLostPets));
lostPetsRouter.post('/', requireAuth, asyncHandler(createLostPet));
lostPetsRouter.post('/:id/found', requireAuth, asyncHandler(markFound));
lostPetsRouter.get('/matches', requireAuth, asyncHandler(findMatchesForReport));

function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const { verifyAuthToken } = require('@/utils/jwt');
      req.user = verifyAuthToken(header.substring(7).trim());
    } catch {
      /* anonymous */
    }
  }
  next();
}
