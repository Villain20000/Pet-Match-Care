import { Router } from 'express';
import { requireAuth, requireRole } from '@/middlewares/auth';
import {
  createReport,
  getReportById,
  listNearbyReports,
  updateReportStatus,
} from '@/controllers/reports.controller';
import { Role } from '@prisma/client';

export const reportsRouter = Router();

reportsRouter.post('/', requireAuth, createReport);
reportsRouter.get('/nearby', requireAuth, listNearbyReports);
reportsRouter.get('/:id', requireAuth, getReportById);
reportsRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole(Role.MUNICIPAL_WORKER, Role.SHELTER_ADMIN),
  updateReportStatus,
);
