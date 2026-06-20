/**
 * End-to-end test for the bilingual error envelope.
 *
 * Boots a minimal Express app, walks every error path, and asserts:
 *   1. `messages.en` and `messages.el` are both populated correctly.
 *   2. `message` resolves to the active locale via `Accept-Language`.
 *   3. `req.user.locale` wins over the `Accept-Language` header.
 *   4. Default fallback to Greek when neither signal is present.
 *   5. {{var}} substitution works for parameterized codes
 *      (ILLEGAL_TRANSITION, STEP_UP_REQUIRED).
 *   6. Per-kind 404 codes carry targeted messages
 *      (APPLICATION_NOT_FOUND, ALERT_NOT_FOUND, STRAY_REPORT_NOT_FOUND).
 *
 * Run: npx ts-node scripts/test-i18n.ts (or `npm run test:i18n`).
 */
import express, { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import {
  HttpError,
  errorHandler,
  notFoundHandler,
  wireError,
  throwHttp,
} from '@/middlewares/error';
import { resolveRequestLocale } from '@/middlewares/auth';

type Lang = 'el' | 'en';
type Failure = { name: string; got: unknown; want: unknown };

const failures: Failure[] = [];
const assert = (name: string, cond: boolean, got: unknown, want: unknown) => {
  if (!cond) failures.push({ name, got, want });
  console.log(`${cond ? '✓' : '✗'} ${name}`);
};

// ---------------------------------------------------------------------------
// Spin up the test app — mirrors production middleware order.
// ---------------------------------------------------------------------------
const buildApp = () => {
  const app = express();
  app.use(express.json());

  // Mirror optionalAuth from middlewares/auth.ts but inline so we can
  // attach `req.user` for tests without a real JWT verifier.
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const fakeUserLocale = req.headers['x-test-user-locale'];
    if (fakeUserLocale) {
      req.user = { sub: 'test', locale: String(fakeUserLocale) as Lang } as any;
    }
    req.locale = resolveRequestLocale(req);
    next();
  });

  app.get('/unauth', (_req: Request) => {
    throwHttp(_req, 401, 'UNAUTHORIZED');
  });

  app.get('/transition', (_req: Request) => {
    throw new HttpError(400, 'ILLEGAL_TRANSITION', { from: 'SUBMITTED', to: 'APPROVED' });
  });

  app.get('/zod', (_req: Request, _res: Response) => {
    z.object({ x: z.string() }).parse({ x: 42 });
  });

  // Route 4 — Direct wireError call (mimics middlewares/auth.ts and
  // routes/auth.routes.ts). Preserves an extra `detail` field on top
  // of the bilingual envelope.
  app.get('/wire-direct', (req: Request, res: Response) => {
    const { status, body } = wireError(req, 401, 'INVALID_TOKEN', { detail: 'jwt expired' });
    res.status(status).json({ ...body, detail: 'jwt expired' });
  });

  // Route 5 — STEP_UP_REQUIRED with capability interpolation (mirrors
  // what middlewares/auth.ts requireStepUp does).
  app.get('/step-up', (req: Request, res: Response) => {
    const { status, body } = wireError(req, 403, 'STEP_UP_REQUIRED', { capability: 'adopt-submit' });
    res.status(status).json({ ...body, capability: 'adopt-submit' });
  });

  app.get('/app-not-found', (_req: Request) => {
    throw new HttpError(404, 'APPLICATION_NOT_FOUND');
  });
  app.get('/alert-not-found', (_req: Request) => {
    throw new HttpError(404, 'ALERT_NOT_FOUND');
  });
  app.get('/report-not-found', (_req: Request) => {
    throw new HttpError(404, 'STRAY_REPORT_NOT_FOUND');
  });

  // ---- TOTP / 2FA (added when auth.service.ts + oauth.service.ts were
  //      converted to code-only HttpError throws). Each new code mirrors
  //      the bilingual catalog under el.ts/en.ts.
  app.get('/totp-already-enabled', (_req: Request) => {
    throw new HttpError(409, 'TOTP_ALREADY_ENABLED');
  });
  app.get('/totp-enrollment-not-started', (_req: Request) => {
    throw new HttpError(400, 'TOTP_ENROLLMENT_NOT_STARTED');
  });
  app.get('/totp-not-enabled', (_req: Request) => {
    throw new HttpError(400, 'TOTP_NOT_ENABLED');
  });
  app.get('/invalid-2fa-code', (_req: Request) => {
    throw new HttpError(401, 'INVALID_2FA_CODE');
  });

  // ---- SSO / OAuth ----
  app.get('/sso-email-not-verified', (_req: Request) => {
    throw new HttpError(403, 'SSO_EMAIL_NOT_VERIFIED');
  });
  app.get('/sso-token-exchange-failed', (_req: Request) => {
    throw new HttpError(502, 'SSO_TOKEN_EXCHANGE_FAILED');
  });
  app.get('/sso-userinfo-failed', (_req: Request) => {
    throw new HttpError(502, 'SSO_USERINFO_FAILED');
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

const app = buildApp();
const server = app.listen(0, async () => {
  const port = (server.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}`;

  type Call = {
    name: string;
    path: string;
    headers?: Record<string, string>;
    // `_s` is intentionally unused for callouts that only inspect the body.
    assert: (status: number, body: any) => void;
  };

  const calls: Call[] = [
    {
      name: 'UNAUTHORIZED (Greek via Accept-Language)',
      path: '/unauth',
      headers: { 'Accept-Language': 'el' },
      assert: (s, b) => {
        assert('status 401', s === 401, s, 401);
        assert('code UNAUTHORIZED', b.error === 'UNAUTHORIZED', b.error, 'UNAUTHORIZED');
        assert('message is Greek', b.message === 'Απαιτείται σύνδεση', b.message, 'Απαιτείται σύνδεση');
        assert('messages.en is English', b.messages?.en === 'Authentication required', b.messages?.en, 'Authentication required');
        assert('messages.el is Greek', b.messages?.el === 'Απαιτείται σύνδεση', b.messages?.el, 'Απαιτείται σύνδεση');
      },
    },
    {
      name: 'UNAUTHORIZED (English via Accept-Language en-US)',
      path: '/unauth',
      headers: { 'Accept-Language': 'en-US,en;q=0.9' },
      assert: (s, b) => {
        assert('status 401', s === 401, s, 401);
        assert('message is English', b.message === 'Authentication required', b.message, 'Authentication required');
        assert('messages.el is Greek', b.messages?.el === 'Απαιτείται σύνδεση', b.messages?.el, 'Απαιτείται σύνδεση');
      },
    },
    {
      name: 'user.locale wins over Accept-Language (req.user.locale = en)',
      path: '/unauth',
      headers: { 'Accept-Language': 'el', 'x-test-user-locale': 'en' },
      assert: (_s, b) => {
        assert('message follows user.locale (en)', b.message === 'Authentication required', b.message, 'Authentication required');
      },
    },
    {
      name: 'user.locale wins over Accept-Language (req.user.locale = el)',
      path: '/unauth',
      headers: { 'Accept-Language': 'en', 'x-test-user-locale': 'el' },
      assert: (_s, b) => {
        assert('message follows user.locale (el)', b.message === 'Απαιτείται σύνδεση', b.message, 'Απαιτείται σύνδεση');
      },
    },
    {
      name: 'no Accept-Language, no user.locale → el fallback',
      path: '/unauth',
      headers: {},
      assert: (_s, b) => {
        assert('message is Greek (default)', b.message === 'Απαιτείται σύνδεση', b.message, 'Απαιτείται σύνδεση');
      },
    },
    {
      name: 'ILLEGAL_TRANSITION with {{from}} → {{to}} vars',
      path: '/transition',
      headers: { 'Accept-Language': 'en' },
      assert: (s, b) => {
        assert('status 400', s === 400, s, 400);
        assert('English interpolation', b.message === 'Illegal state transition: SUBMITTED → APPROVED', b.message, 'Illegal state transition: SUBMITTED → APPROVED');
        assert('Greek interpolation', b.messages.el === 'Μη επιτρεπτή μετάβαση: SUBMITTED → APPROVED', b.messages.el, 'Μη επιτρεπτή μετάβαση: SUBMITTED → APPROVED');
      },
    },
    {
      name: 'STEP_UP_REQUIRED with {{capability}} vars',
      path: '/step-up',
      headers: { 'Accept-Language': 'en' },
      assert: (s, b) => {
        assert('status 403', s === 403, s, 403);
        assert('English ability interpolation', b.message === 'Two-factor confirmation required for “adopt-submit”', b.message, 'Two-factor confirmation required for “adopt-submit”');
        assert('Greek ability interpolation', b.messages.el === 'Απαιτείται επιβεβαίωση 2FA για την ενέργεια «adopt-submit»', b.messages.el, 'Απαιτείται επιβεβαίωση 2FA για την ενέργεια «adopt-submit»');
      },
    },
    {
      name: 'ZodError flows through with VALIDATION_ERROR code',
      path: '/zod',
      headers: { 'Accept-Language': 'en' },
      assert: (s, b) => {
        assert('status 400', s === 400, s, 400);
        assert('code VALIDATION_ERROR', b.error === 'VALIDATION_ERROR', b.error, 'VALIDATION_ERROR');
        assert('message is English', b.message === 'Invalid data', b.message, 'Invalid data');
        assert('issues attached', !!b.issues && Object.keys(b.issues).length > 0, Object.keys(b.issues ?? {}), ['x']);
      },
    },
    {
      name: 'wireError on a route mimics middlewares/auth.ts behaviour',
      path: '/wire-direct',
      headers: { 'Accept-Language': 'el' },
      assert: (s, b) => {
        assert('status 401', s === 401, s, 401);
        assert('code INVALID_TOKEN', b.error === 'INVALID_TOKEN', b.error, 'INVALID_TOKEN');
        assert('message is Greek', b.message === 'Μη έγκυρο ή ληγμένο διακριτικό', b.message, 'Μη έγκυρο ή ληγμένο διακριτικό');
        assert('detail preserved', b.detail === 'jwt expired', b.detail, 'jwt expired');
      },
    },
    {
      name: 'APPLICATION_NOT_FOUND localised',
      path: '/app-not-found',
      headers: { 'Accept-Language': 'el' },
      assert: (s, b) => {
        assert('status 404', s === 404, s, 404);
        assert('code APPLICATION_NOT_FOUND', b.error === 'APPLICATION_NOT_FOUND', b.error, 'APPLICATION_NOT_FOUND');
        assert('Greek specific message', b.message === 'Η αίτηση δεν βρέθηκε', b.message, 'Η αίτηση δεν βρέθηκε');
        assert('English specific message', b.messages.en === 'This application could not be found', b.messages.en, 'This application could not be found');
      },
    },
    {
      name: 'ALERT_NOT_FOUND localised',
      path: '/alert-not-found',
      headers: { 'Accept-Language': 'el' },
      assert: (_s, b) => {
        assert('code ALERT_NOT_FOUND', b.error === 'ALERT_NOT_FOUND', b.error, 'ALERT_NOT_FOUND');
        assert('Greek specific message', b.message === 'Η φόλα δεν βρέθηκε', b.message, 'Η φόλα δεν βρέθηκε');
      },
    },
    {
      name: 'STRAY_REPORT_NOT_FOUND localised',
      path: '/report-not-found',
      headers: { 'Accept-Language': 'en' },
      assert: (_s, b) => {
        assert('code STRAY_REPORT_NOT_FOUND', b.error === 'STRAY_REPORT_NOT_FOUND', b.error, 'STRAY_REPORT_NOT_FOUND');
        assert('English specific message', b.message === 'This stray report could not be found', b.message, 'This stray report could not be found');
        assert('Greek specific message', b.messages.el === 'Η αναφορά δεν βρέθηκε', b.messages.el, 'Η αναφορά δεν βρέθηκε');
      },
    },
    {
      name: 'notFoundHandler returns bilingual generic 404',
      path: '/this-route-does-not-exist',
      headers: { 'Accept-Language': 'en' },
      assert: (s, b) => {
        assert('status 404', s === 404, s, 404);
        assert('code NOT_FOUND', b.error === 'NOT_FOUND', b.error, 'NOT_FOUND');
        assert('English message', b.message === 'Resource not found', b.message, 'Resource not found');
        assert('Greek message cached', b.messages?.el === 'Ο πόρος δεν βρέθηκε', b.messages?.el, 'Ο πόρος δεν βρέθηκε');
      },
    },

    // ---- TOTP / 2FA assertions added after the bilingual-envelope refactor ----
    {
      name: 'TOTP_ALREADY_ENABLED returns 409 with both messages',
      path: '/totp-already-enabled',
      headers: { 'Accept-Language': 'el' },
      assert: (s, b) => {
        assert('status 409', s === 409, s, 409);
        assert('code TOTP_ALREADY_ENABLED', b.error === 'TOTP_ALREADY_ENABLED', b.error, 'TOTP_ALREADY_ENABLED');
        assert('Greek message', b.message === 'Ο λογαριασμός έχει ήδη 2FA ενεργό', b.message, 'Ο λογαριασμός έχει ήδη 2FA ενεργό');
        assert('English mirror', b.messages?.en === 'Two-factor authentication is already enabled', b.messages?.en, 'Two-factor authentication is already enabled');
      },
    },
    {
      name: 'TOTP_ALREADY_ENABLED resolved to English via Accept-Language',
      path: '/totp-already-enabled',
      headers: { 'Accept-Language': 'en' },
      assert: (s, b) => {
        assert('status 409', s === 409, s, 409);
        assert('code TOTP_ALREADY_ENABLED', b.error === 'TOTP_ALREADY_ENABLED', b.error, 'TOTP_ALREADY_ENABLED');
        assert('message is English', b.message === 'Two-factor authentication is already enabled', b.message, 'Two-factor authentication is already enabled');
      },
    },
    {
      // Locks the user-locale path: even when the network says EL, an
      // authenticated English user wins. Same code as the existing
      // UNAUTHORIZED x-test-user-locale case.
      name: 'TOTP_ALREADY_ENABLED user.locale=en wins over Accept-Language:el',
      path: '/totp-already-enabled',
      headers: { 'Accept-Language': 'el', 'x-test-user-locale': 'en' },
      assert: (_s, b) => {
        assert('message follows user.locale (en)', b.message === 'Two-factor authentication is already enabled', b.message, 'Two-factor authentication is already enabled');
      },
    },
    {
      name: 'TOTP_ENROLLMENT_NOT_STARTED returns 400',
      path: '/totp-enrollment-not-started',
      headers: { 'Accept-Language': 'el' },
      assert: (s, b) => {
        assert('status 400', s === 400, s, 400);
        assert('Greek message', b.message === 'Δεν έχει ξεκινήσει η εγγραφή 2FA', b.message, 'Δεν έχει ξεκινήσει η εγγραφή 2FA');
        assert('English mirror', b.messages?.en === 'Two-factor setup has not started', b.messages?.en, 'Two-factor setup has not started');
      },
    },
    {
      name: 'TOTP_NOT_ENABLED English via Accept-Language',
      path: '/totp-not-enabled',
      headers: { 'Accept-Language': 'en' },
      assert: (s, b) => {
        assert('status 400', s === 400, s, 400);
        assert('code TOTP_NOT_ENABLED', b.error === 'TOTP_NOT_ENABLED', b.error, 'TOTP_NOT_ENABLED');
        assert('English message', b.message === 'Two-factor authentication is not enabled on this account', b.message, 'Two-factor authentication is not enabled on this account');
      },
    },
    {
      name: 'INVALID_2FA_CODE returns 401',
      path: '/invalid-2fa-code',
      headers: { 'Accept-Language': 'el' },
      assert: (s, b) => {
        assert('status 401', s === 401, s, 401);
        assert('Greek message', b.message === 'Λάθος κωδικός 2FA ή κωδικός ανάκτησης', b.message, 'Λάθος κωδικός 2FA ή κωδικός ανάκτησης');
        assert('English mirror', b.messages?.en === 'Wrong 2FA code or recovery code', b.messages?.en, 'Wrong 2FA code or recovery code');
      },
    },
    {
      name: 'SSO_EMAIL_NOT_VERIFIED returns 403',
      path: '/sso-email-not-verified',
      headers: { 'Accept-Language': 'el' },
      assert: (s, b) => {
        assert('status 403', s === 403, s, 403);
        assert('Greek message', b.message === 'Ο πάροχος SSO δεν επαλήθευσε το email', b.message, 'Ο πάροχος SSO δεν επαλήθευσε το email');
        assert('English mirror', b.messages?.en === 'The SSO provider did not verify the email', b.messages?.en, 'The SSO provider did not verify the email');
      },
    },
    {
      name: 'SSO_TOKEN_EXCHANGE_FAILED returns 502',
      path: '/sso-token-exchange-failed',
      headers: { 'Accept-Language': 'en' },
      assert: (s, b) => {
        assert('status 502', s === 502, s, 502);
        assert('code SSO_TOKEN_EXCHANGE_FAILED', b.error === 'SSO_TOKEN_EXCHANGE_FAILED', b.error, 'SSO_TOKEN_EXCHANGE_FAILED');
        assert('English message', b.message === 'Failed to exchange the code with the SSO provider', b.message, 'Failed to exchange the code with the SSO provider');
      },
    },
    {
      name: 'SSO_USERINFO_FAILED returns 502 (Greek flip)',
      path: '/sso-userinfo-failed',
      headers: { 'Accept-Language': 'el' },
      assert: (s, b) => {
        assert('status 502', s === 502, s, 502);
        assert('Greek message', b.message === 'Αποτυχία λήψης στοιχείων από τον πάροχο SSO', b.message, 'Αποτυχία λήψης στοιχείων από τον πάροχο SSO');
        assert('English mirror', b.messages?.en === 'Failed to fetch the user profile from the SSO provider', b.messages?.en, 'Failed to fetch the user profile from the SSO provider');
      },
    },
  ];

  for (const c of calls) {
    console.log(`\n— ${c.name}`);
    try {
      const r = await fetch(`${base}${c.path}`, { headers: c.headers });
      const body = await r.json().catch(() => ({}));
      c.assert(r.status, body);
    } catch (e) {
      assert(`fetch(${c.path}) succeeded`, false, e, null);
    }
  }

  console.log();
  if (failures.length === 0) {
    console.log('✅ All bilingual error-envelope assertions passed.');
  } else {
    console.log(`❌ ${failures.length} assertion(s) failed:`);
    failures.forEach((f) =>
      console.log(`  - ${f.name}\n      got:  ${JSON.stringify(f.got)}\n      want: ${JSON.stringify(f.want)}`),
    );
  }
  server.close();
  process.exit(failures.length === 0 ? 0 : 1);
});
