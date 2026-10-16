import { Router } from 'express';
import { optionalAuth, requireAuth, requireRole } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/asyncHandler';
import {
  createPet,
  expressInterest,
  getPet,
  listPets,
  markAdopted,
} from '@/controllers/adoption.controller';
import { Role } from '@prisma/client';

export const adoptionRouter = Router();

adoptionRouter.get('/', optionalAuth, asyncHandler(listPets));
adoptionRouter.get('/:id', optionalAuth, asyncHandler(getPet));

// Shelter admins only can add a pet.
adoptionRouter.post(
  '/',
  requireAuth,
  requireRole(Role.SHELTER_ADMIN, Role.MUNICIPAL_WORKER),
  asyncHandler(createPet),
);

adoptionRouter.post('/:id/interest', requireAuth, asyncHandler(expressInterest));
adoptionRouter.patch(
  '/:id/adopted',
  requireAuth,
  requireRole(Role.SHELTER_ADMIN),
  asyncHandler(markAdopted),
);
