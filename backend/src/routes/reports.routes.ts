import { Router } from 'express';
import { requireAuth, requireRole } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/asyncHandler';
import {
  createReport,
  getReportById,
  listNearbyReports,
  updateReportStatus,
} from '@/controllers/reports.controller';
import { Role } from '@prisma/client';

export const reportsRouter = Router();

reportsRouter.post('/', requireAuth, asyncHandler(createReport));
reportsRouter.get('/nearby', requireAuth, asyncHandler(listNearbyReports));
reportsRouter.get('/:id', requireAuth, asyncHandler(getReportById));
reportsRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole(Role.MUNICIPAL_WORKER, Role.SHELTER_ADMIN),
  asyncHandler(updateReportStatus),
);
