import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { verifyAuthToken, type AuthPayload, isStepUpFresh } from '@/utils/jwt';
import { wireError } from '@/middlewares/error';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthPayload;
    /** Resolved once at request entry. Backed by JWT claim, then `Accept-Language`. */
    locale?: 'el' | 'en';
  }
}

const resolveLocale = (
  hint?: string,
  fallback: 'el' | 'en' = 'el',
): 'el' | 'en' => {
  if (!hint) return fallback;
  const v = hint.toLowerCase();
  if (v.startsWith('el')) return 'el';
  if (v.startsWith('en')) return 'en';
  return fallback;
};

export const resolveRequestLocale = (req: Request): 'el' | 'en' => {
  if (req.user?.locale) return resolveLocale(req.user.locale);
  return resolveLocale(req.headers['accept-language'] as string | undefined);
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    const { status, body } = wireError(req, 401, 'UNAUTHORIZED');
    return res.status(status).json(body);
  }
  const token = header.substring('Bearer '.length).trim();
  try {
    req.user = verifyAuthToken(token);
    req.locale = resolveLocale(req.user.locale);
    return next();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    const { status, body } = wireError(req, 401, 'INVALID_TOKEN');
    return res.status(status).json({ ...body, detail });
  }
};

export const requireRole =
  (...allowed: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const { status, body } = wireError(req, 401, 'UNAUTHORIZED');
      return res.status(status).json(body);
    }
    if (!allowed.includes(req.user.role)) {
      const { status, body } = wireError(req, 403, 'FORBIDDEN', {
        required: allowed.join(', '),
        actual: req.user.role,
      });
      return res.status(status).json({
        ...body,
        required: allowed,
        actual: req.user.role,
      });
    }
    return next();
  };

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = verifyAuthToken(header.substring('Bearer '.length).trim());
      req.locale = resolveLocale(req.user.locale);
    } catch {
      req.locale = resolveLocale(req.headers['accept-language'] as string | undefined);
    }
  } else {
    req.locale = resolveLocale(req.headers['accept-language'] as string | undefined);
  }
  next();
};

export const requireStepUp =
  (capability: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const { status, body } = wireError(req, 401, 'UNAUTHORIZED');
      return res.status(status).json(body);
    }
    if (req.user.totpEnabled && !isStepUpFresh(req.user)) {
      // Capability interpolates into the STEP_UP_REQUIRED template so the
      // toast says "Two-factor confirmation required for {capability}".
      const { status, body } = wireError(req, 403, 'STEP_UP_REQUIRED', { capability });
      return res.status(status).json({ ...body, capability });
    }
    return next();
  };
