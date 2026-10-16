import { Router } from 'express';
import { env } from '@/config/env';
import {
  forgot,
  login,
  logout,
  logoutEverywhere,
  me,
  refresh,
  register,
  resendVerification,
  reset,
  stepUp,
  updateMe,
  updatePushToken,
  verifyEmail,
  listSessions,
} from '@/controllers/auth.controller';
import { begin, confirm, disable } from '@/controllers/totp.controller';
import { callbackGoogle, startGoogle } from '@/controllers/oauth.controller';
import { requireAuth } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { wireError } from '@/middlewares/error';

export const authRouter = Router();

// ----- Identity / password -----
authRouter.post('/register', asyncHandler(register));
authRouter.post('/login', asyncHandler(login));
authRouter.post('/refresh', asyncHandler(refresh));
authRouter.post('/logout', asyncHandler(logout));
authRouter.post('/logout-everywhere', requireAuth, asyncHandler(logoutEverywhere));
authRouter.get('/me', requireAuth, asyncHandler(me));
authRouter.get('/sessions', requireAuth, asyncHandler(listSessions));

// ----- Email verification -----
authRouter.post('/verify-email', asyncHandler(verifyEmail));
authRouter.post('/resend-verification', requireAuth, asyncHandler(resendVerification));

// ----- Password reset -----
authRouter.post('/forgot', asyncHandler(forgot));
authRouter.post('/reset', asyncHandler(reset));

// ----- 2FA / step-up -----
authRouter.post('/2fa/begin', requireAuth, asyncHandler(begin));
authRouter.post('/2fa/confirm', requireAuth, asyncHandler(confirm));
authRouter.post('/2fa/disable', requireAuth, asyncHandler(disable));
authRouter.post('/step-up', requireAuth, asyncHandler(stepUp));

// ----- Push -----
authRouter.put('/push-token', requireAuth, asyncHandler(updatePushToken));
authRouter.patch('/me', requireAuth, asyncHandler(updateMe));

// ----- OAuth (Google) -----
authRouter.get('/oauth/google/start', startGoogle);
authRouter.get('/oauth/google/callback', callbackGoogle);

// Catch-all to redirect email magic links that hit the web fallback URL
// into the app deep-link. Browsers that don't recognise the scheme get a
// friendly HTML page with click-to-open instructions.
authRouter.get('/verify-email', (req, res) => {
  const token = String(req.query.token ?? '');
  if (!token) {
    const { status, body } = wireError(req, 400, 'MISSING_TOKEN');
    return res.status(status).json(body);
  }
  return res.redirect(302, `${env.APP_DEEP_LINK_SCHEME}://verify-email?token=${encodeURIComponent(token)}`);
});

authRouter.get('/reset-password', (req, res) => {
  const token = String(req.query.token ?? '');
  if (!token) {
    const { status, body } = wireError(req, 400, 'MISSING_TOKEN');
    return res.status(status).json(body);
  }
  return res.redirect(302, `${env.APP_DEEP_LINK_SCHEME}://reset-password?token=${encodeURIComponent(token)}`);
});
