// Re-export the canonical HttpError so service-layer code can construct it
// without reaching into the middleware folder.
export { HttpError } from '@/middlewares/error';
export { throwHttp } from '@/middlewares/error';
