import type { Request, Response, NextFunction } from 'express';
import { ugcService } from '@/services/ugc.service';

export const ugcController = {
  async submitReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ugcService.submitReport(req.user!.sub, req.body);
      res.status(201).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  },

  async blockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const block = await ugcService.blockUser(req.user!.sub, req.body.blockedId);
      res.status(201).json({ success: true, data: block });
    } catch (err) {
      next(err);
    }
  },

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      await ugcService.deleteUserAccount(req.user!.sub);
      res.json({ success: true, message: 'Account and associated data deleted' });
    } catch (err) {
      next(err);
    }
  },
};
