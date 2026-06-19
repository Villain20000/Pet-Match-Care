import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { bilingualMessages, localeForRequest, tForRequest } from '@/services/i18n';

/**
 * Code-only HTTP error.
 *
 * Why drop the message: services throw `HttpError` without access to
 * `req`, so they cannot localize. The error middleware is the single
 * place that resolves locale (via user.lang → Accept-Language → `el`),
 * so it must own the translation. Optional `meta` is merged into the
 * translator's `{{var}}` substitutions.
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    public meta?: Record<string, string | number>,
  ) {
    // Friendlier log message than the raw code string.
    super(`[${status}] ${code}`);
  }
}

type Vars = Record<string, string | number> | undefined;

/**
 * Merge order: `extraVars` passed by the middleware layer over `meta` on
 * the HttpError instance. The middleware is the last word — any var a
 * route handler attaches explicitly to wireError wins over what the
 * underlying HttpError carried.
 *
 * Example: a thrown HttpError with meta `{ status: 400 }` reaching
 * `wireError(req, 409, ...)` will have `meta: {status:400}` and
 * `extraVars: undefined`; conversely, if a route does
 * `wireError(req, 403, 'STEP_UP_REQUIRED', { capability: 'x' })` for a
 * thrown HttpError that had no meta, only `{ capability: 'x' }` flows.
 */
const mergeVars = (extraVars?: Vars, meta?: Vars): Vars =>
  ({ ...meta, ...extraVars });

/**
 * Build the canonical bilingual error envelope for `req`.
 * Caller may pass `extraVars` (e.g. {capability}) which are merged on
 * top of any `meta` HttpError carried.
 */
export const wireError = (
  req: Request,
  status: number,
  code: string,
  extraVars?: Vars,
) => {
  const locale = localeForRequest(req);
  // For HttpError-thrown cases the middleware passes `err.meta` as the
  // 4th arg, so mergeVars handles it transparently.
  const messages = bilingualMessages(`errors.${code}`, mergeVars(extraVars));
  return {
    locale,
    status,
    body: {
      error: code,
      message: messages[locale],
      messages,
    },
  };
};

/** Throw a code-only HttpError containing optional substitution vars. */
export const throwHttp = (
  _: Request,
  status: number,
  code: string,
  meta?: Vars,
): never => {
  throw new HttpError(status, code, meta);
};

export const notFoundHandler = (req: Request, res: Response) => {
  const { status, body } = wireError(req, 404, 'NOT_FOUND');
  res.status(status).json(body);
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  if (err instanceof ZodError) {
    const { status, body } = wireError(req, 400, 'VALIDATION_ERROR');
    return res.status(status).json({ ...body, issues: err.flatten().fieldErrors });
  }

  if (err instanceof HttpError) {
    const { status, body } = wireError(req, err.status, err.code, err.meta);
    return res.status(status).json(body);
  }

  // eslint-disable-next-line no-console
  console.error('[unhandled]', err);

  const { status, body } = wireError(req, 500, 'INTERNAL_SERVER_ERROR');
  return res.status(status).json({
    ...body,
    serverMessage: tForRequest(req, 'errors.INTERNAL_SERVER_ERROR'),
  });
};
