import { Router } from 'express';
import { inbox, mark, markAll, unread } from '@/controllers/notifications.controller';
import { requireAuth } from '@/middlewares/auth';

export const notificationsRouter = Router();
notificationsRouter.get('/inbox', requireAuth, inbox);
notificationsRouter.get('/unread', requireAuth, unread);
notificationsRouter.post('/mark', requireAuth, mark);
notificationsRouter.post('/mark-all', requireAuth, markAll);
