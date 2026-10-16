import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/asyncHandler';
import {
  createPoisonAlert,
  getActivePoisonAlerts,
  resendPoisonAlertPush,
} from '@/controllers/alerts.controller';

export const alertsRouter = Router();

alertsRouter.post('/poison', requireAuth, asyncHandler(createPoisonAlert));
alertsRouter.get('/poison/active', requireAuth, asyncHandler(getActivePoisonAlerts));
alertsRouter.post('/poison/:id/test-push', requireAuth, asyncHandler(resendPoisonAlertPush));
