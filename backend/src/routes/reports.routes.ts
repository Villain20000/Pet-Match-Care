import { Router } from 'express';
import { requireAuth, requireRole } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/asyncHandler';
import {
  getReportById,
  listNearbyReports,
  updateReportStatus,
} from '@/controllers/reports.controller';
import { Role } from '@prisma/client';

export const reportsRouter = Router();

// NOTE: the POST handler lives in the timeline router. Mounting it here
// as well would shadow `POST /api/reports` (see timeline.routes.ts), so
// only the read-side routes are declared on this router.
reportsRouter.get('/nearby', requireAuth, asyncHandler(listNearbyReports));
reportsRouter.get('/:id', requireAuth, asyncHandler(getReportById));
reportsRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole(Role.MUNICIPAL_WORKER, Role.SHELTER_ADMIN),
  asyncHandler(updateReportStatus),
);
