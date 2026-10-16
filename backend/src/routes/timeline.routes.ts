import { Router } from 'express';
import { requireAuth, requireRole } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { createReportWithTimeline, getTimeline, postUpdate } from '@/controllers/timeline.controller';
import { Role } from '@prisma/client';

export const timelineRouter = Router();

// Citizens create reports; we funnel them through the timeline-aware handler.
timelineRouter.post('/reports', requireAuth, asyncHandler(createReportWithTimeline));
timelineRouter.post(
  '/reports/:id/updates',
  requireAuth,
  requireRole(Role.MUNICIPAL_WORKER, Role.SHELTER_ADMIN, Role.PLATFORM_ADMIN),
  asyncHandler(postUpdate),
);
timelineRouter.get(
  '/reports/:id/timeline',
  requireAuth,
  asyncHandler(getTimeline),
);
