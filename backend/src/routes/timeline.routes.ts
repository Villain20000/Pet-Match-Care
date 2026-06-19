import { Router } from 'express';
import { createReportWithTimeline, getTimeline, postUpdate } from '@/controllers/timeline.controller';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '@/middlewares/auth';

export const timelineRouter = Router();

// Citizens create reports; we funnel them through the timeline-aware handler.
timelineRouter.post('/reports', requireAuth, createReportWithTimeline);
timelineRouter.post('/reports/:id/updates', requireAuth, requireRole(Role.MUNICIPAL_WORKER, Role.SHELTER_ADMIN, Role.PLATFORM_ADMIN), postUpdate);
timelineRouter.get('/reports/:id/timeline', requireAuth, getTimeline);
