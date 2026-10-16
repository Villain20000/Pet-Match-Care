import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { inbox, mark, markAll, unread } from '@/controllers/notifications.controller';

export const notificationsRouter = Router();
notificationsRouter.get('/inbox', requireAuth, asyncHandler(inbox));
notificationsRouter.get('/unread', requireAuth, asyncHandler(unread));
notificationsRouter.post('/mark', requireAuth, asyncHandler(mark));
notificationsRouter.post('/mark-all', requireAuth, asyncHandler(markAll));
