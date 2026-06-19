import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth';
import {
  createPoisonAlert,
  getActivePoisonAlerts,
  resendPoisonAlertPush,
} from '@/controllers/alerts.controller';

export const alertsRouter = Router();

alertsRouter.post('/poison', requireAuth, createPoisonAlert);
alertsRouter.get('/poison/active', requireAuth, getActivePoisonAlerts);
alertsRouter.post('/poison/:id/test-push', requireAuth, resendPoisonAlertPush);
