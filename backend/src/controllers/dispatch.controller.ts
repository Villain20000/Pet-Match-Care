import { Request, Response } from 'express';
import { z } from 'zod';
import { RescueDispatchStatus } from '@prisma/client';
import { throwHttp } from '@/middlewares/error';
import {
  assignOrUpdateDispatch,
  getDispatchByReportId,
} from '@/services/dispatch.service';

const UpdateDispatchSchema = z.object({
  rescuerId: z.string().uuid().optional(),
  status: z.nativeEnum(RescueDispatchStatus),
  notes: z.string().max(1000).optional(),
});

export const updateDispatch = async (req: Request, res: Response) => {
  if (!req.user) return throwHttp(req, 401, 'UNAUTHORIZED');

  const reportId = z.string().uuid().parse(req.params.reportId);
  const input = UpdateDispatchSchema.parse(req.body);

  const dispatch = await assignOrUpdateDispatch({
    reportId,
    actorId: req.user.sub,
    actorRole: req.user.role,
    rescuerId: input.rescuerId,
    status: input.status,
    notes: input.notes,
  });

  return res.json({ success: true, dispatch });
};

export const getDispatch = async (req: Request, res: Response) => {
  if (!req.user) return throwHttp(req, 401, 'UNAUTHORIZED');

  const reportId = z.string().uuid().parse(req.params.reportId);
  const dispatch = await getDispatchByReportId(reportId);

  if (!dispatch) return throwHttp(req, 404, 'NOT_FOUND');

  return res.json({ dispatch });
};
