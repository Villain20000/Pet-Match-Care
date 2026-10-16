import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { ugcController } from '@/controllers/ugc.controller';

export const ugcRouter = Router();

ugcRouter.post('/ugc/report', requireAuth, asyncHandler(ugcController.submitReport));
ugcRouter.post('/ugc/block', requireAuth, asyncHandler(ugcController.blockUser));
ugcRouter.delete('/auth/account', requireAuth, asyncHandler(ugcController.deleteAccount));
