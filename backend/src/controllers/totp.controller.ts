import { Request, Response } from 'express';
import { z } from 'zod';
import { throwHttp } from "@/middlewares/error";
import {
  beginTotpEnrollment,
  confirmTotpEnrollment,
  disableTotp,
} from '@/services/auth.service';

const BeginSchema = z.object({});
const ConfirmSchema = z.object({ code: z.string().regex(/^\d{6}$/, '6-ψήφιος κωδικός') });
const DisableSchema = z.object({ code: z.string().min(6).max(20) });

export const begin = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  BeginSchema.parse(req.body ?? {});
  const result = await beginTotpEnrollment(req.user!.sub);
  return res.json(result);
};

export const confirm = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const { code } = ConfirmSchema.parse(req.body);
  const { recoveryCodes } = await confirmTotpEnrollment(req.user!.sub, code);
  return res.json({ success: true, recoveryCodes });
};

export const disable = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const { code } = DisableSchema.parse(req.body);
  await disableTotp(req.user!.sub, code);
  return res.json({ success: true });
};
