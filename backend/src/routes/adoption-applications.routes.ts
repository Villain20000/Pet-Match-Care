import { Router } from 'express';
import { requireAuth, requireRole, requireStepUp } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/asyncHandler';
import {
  createOrUpdateDraft,
  getApplication,
  listForShelter,
  listMine,
  scheduleHomeCheck,
  transition,
  withdrawApplication,
} from '@/controllers/adoption-applications.controller';

export const adoptionApplicationsRouter = Router();

adoptionApplicationsRouter.get(
  '/mine',
  requireAuth,
  asyncHandler(listMine),
);
adoptionApplicationsRouter.get(
  '/queue',
  requireAuth,
  requireRole('SHELTER_ADMIN', 'PLATFORM_ADMIN'),
  asyncHandler(listForShelter),
);
adoptionApplicationsRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(getApplication),
);

// Submitting an adoption application requires step-up (2FA within last 5 min).
adoptionApplicationsRouter.post(
  '/',
  requireAuth,
  requireStepUp('adoption:apply'),
  asyncHandler(createOrUpdateDraft),
);
adoptionApplicationsRouter.post('/:id/transition', requireAuth, asyncHandler(transition));
adoptionApplicationsRouter.post('/:id/withdraw', requireAuth, asyncHandler(withdrawApplication));
adoptionApplicationsRouter.post(
  '/:id/home-check',
  requireAuth,
  requireRole('SHELTER_ADMIN', 'PLATFORM_ADMIN'),
  asyncHandler(scheduleHomeCheck),
);
