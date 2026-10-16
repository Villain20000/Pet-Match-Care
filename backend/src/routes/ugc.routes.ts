import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth';
import { ugcController } from '@/controllers/ugc.controller';

export const ugcRouter = Router();

ugcRouter.post('/ugc/report', requireAuth, ugcController.submitReport);
ugcRouter.post('/ugc/block', requireAuth, ugcController.blockUser);
ugcRouter.delete('/auth/account', requireAuth, ugcController.deleteAccount);
