import { Router } from 'express';
import { optionalAuth, requireAuth, requireRole } from '@/middlewares/auth';
import {
  createPet,
  expressInterest,
  getPet,
  listPets,
  markAdopted,
} from '@/controllers/adoption.controller';
import { Role } from '@prisma/client';

export const adoptionRouter = Router();

adoptionRouter.get('/', optionalAuth, listPets);
adoptionRouter.get('/:id', optionalAuth, getPet);

// Shelter admins only can add a pet.
adoptionRouter.post('/', requireAuth, requireRole(Role.SHELTER_ADMIN, Role.MUNICIPAL_WORKER), createPet);

adoptionRouter.post('/:id/interest', requireAuth, expressInterest);
adoptionRouter.patch('/:id/adopted', requireAuth, requireRole(Role.SHELTER_ADMIN), markAdopted);
