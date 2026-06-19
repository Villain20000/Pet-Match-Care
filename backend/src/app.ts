import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';
import { errorHandler, notFoundHandler } from '@/middlewares/error';
import { authRouter } from '@/routes/auth.routes';
import { reportsRouter } from '@/routes/reports.routes';
import { alertsRouter } from '@/routes/alerts.routes';
import { spotsRouter } from '@/routes/spots.routes';
import { adoptionRouter } from '@/routes/adoption.routes';
import { municipalitiesRouter } from '@/routes/municipalities.routes';
import { lostPetsRouter } from '@/routes/lost-pets.routes';
import { adoptionApplicationsRouter } from '@/routes/adoption-applications.routes';
import { badgesRouter } from '@/routes/badges.routes';
import { streaksRouter } from '@/routes/streaks.routes';
import { notificationsRouter } from '@/routes/notifications.routes';
import { timelineRouter } from '@/routes/timeline.routes';
import { listInbox, clearInbox } from '@/controllers/dev-email.controller';

export const buildApp = (): Application => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'RATE_LIMITED', message: 'Πολλές αιτήσεις, δοκιμάστε ξανά σε λίγο' },
  });

  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'RATE_LIMITED', message: 'Πάρα πολλές απόπειρες σύνδεσης' },
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV, service: 'pet-match-care', version: 2 });
  });

  app.use('/api/auth', [authLimiter, writeLimiter], authRouter);
  app.use('/api/reports', writeLimiter, reportsRouter);
  app.use('/api/alerts', writeLimiter, alertsRouter);
  app.use('/api/spots', spotsRouter);
  app.use('/api/adoption', adoptionRouter);
  app.use('/api/municipalities', municipalitiesRouter);

  // v2 routes
  app.use('/api', timelineRouter);
  app.use('/api/lost-pets', lostPetsRouter);
  app.use('/api/adoption-applications', adoptionApplicationsRouter);
  app.use('/api', badgesRouter);
  app.use('/api/streaks', streaksRouter);
  app.use('/api/notifications', notificationsRouter);

  // Dev-only inbox preview. Triple-guarded (NODE_ENV, env var, header).
  app.get('/api/_dev/email-preview', listInbox);
  app.post('/api/_dev/email-preview/clear', clearInbox);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
