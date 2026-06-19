import { Router } from 'express';
import {
  createOrUpdateDraft,
  getApplication,
  listForShelter,
  listMine,
  scheduleHomeCheck,
  transition,
} from '@/controllers/adoption-applications.controller';
import { requireAuth, requireRole, requireStepUp } from '@/middlewares/auth';

export const adoptionApplicationsRouter = Router();

adoptionApplicationsRouter.get('/mine', requireAuth, listMine);
adoptionApplicationsRouter.get('/queue', requireAuth, requireRole('SHELTER_ADMIN', 'PLATFORM_ADMIN'), listForShelter);
adoptionApplicationsRouter.get('/:id', requireAuth, getApplication);

// Submitting an adoption application requires step-up (2FA within last 5 min).
adoptionApplicationsRouter.post('/', requireAuth, requireStepUp('adoption:apply'), createOrUpdateDraft);
adoptionApplicationsRouter.post('/:id/transition', requireAuth, transition);
adoptionApplicationsRouter.post(
  '/:id/home-check',
  requireAuth,
  requireRole('SHELTER_ADMIN', 'PLATFORM_ADMIN'),
  scheduleHomeCheck,
);
