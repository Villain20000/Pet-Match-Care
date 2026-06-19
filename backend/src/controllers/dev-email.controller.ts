/**
 * Dev-only endpoints for inspecting the in-memory email inbox.
 *
 * Triple guard: NODE_ENV must != production, DEV_EMAIL_PREVIEW_TOKEN must
 * be set, AND the caller must send X-Dev-Token matching it.
 */
import { Request, Response } from 'express';
import { env } from '@/config/env';
import { getPreviewInbox, clearPreviewInbox } from '@/services/email.service';
import { wireError } from '@/middlewares/error';

const guarded = (handler: (req: Request, res: Response) => void) =>
  (req: Request, res: Response) => {
    if (env.NODE_ENV === 'production' || !env.DEV_EMAIL_PREVIEW_TOKEN) {
      const { status, body } = wireError(req, 404, 'NOT_FOUND');
      return res.status(status).json(body);
    }
    const token = req.headers['x-dev-token'];
    if (token !== env.DEV_EMAIL_PREVIEW_TOKEN) {
      const { status, body } = wireError(req, 401, 'BAD_DEV_TOKEN');
      return res.status(status).json(body);
    }
    handler(req, res);
  };

export const listInbox = guarded((_req, res) => {
  const limit = Math.min(50, Number(_req.query.limit ?? 10));
  const rows = getPreviewInbox(limit);
  return res.json({
    transport: env.MAIL_TRANSPORT,
    count: rows.length,
    items: rows,
  });
});

export const clearInbox = guarded((_req, res) => {
  clearPreviewInbox();
  return res.json({ success: true });
});
