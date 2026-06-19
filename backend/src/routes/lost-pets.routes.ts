import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth';
import {
  createLostPet,
  findMatchesForReport,
  listLostPets,
  markFound,
} from '@/controllers/lost-pets.controller';

export const lostPetsRouter = Router();

lostPetsRouter.get('/', optionalAuth, listLostPets);
lostPetsRouter.post('/', requireAuth, createLostPet);
lostPetsRouter.post('/:id/found', requireAuth, markFound);
lostPetsRouter.get('/matches', requireAuth, findMatchesForReport);

function optionalAuth(req: any, _res: any, next: any) {
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
