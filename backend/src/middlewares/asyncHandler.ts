import type { NextFunction, Request, Response } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => unknown;

/**
 * Express 4 does NOT forward rejections of async route handlers — a
 * controller that awaits and then throws an `HttpError` (or lets a
 * rejected promise escape) becomes an unhandled rejection and takes the
 * whole process down.
 *
 * Wrapping every handler with this helper converts those rejections into
 * calls to the central error middleware, exactly like synchronous throws
 * already were. Handlers stay plain `(req, res, next)` functions.
 */
export const asyncHandler =
  (handler: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
