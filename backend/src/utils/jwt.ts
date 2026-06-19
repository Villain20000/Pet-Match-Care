import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import { Role } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export interface AuthPayload extends JwtPayload {
  sub: string;          // user id
  role: Role;
  email: string;
  /** User's chosen UI locale. Drives server-side email rendering. */
  locale?: 'el' | 'en';
  /** claim set by /auth/step-up: { amr: ['totp'] } */
  amr?: string[];
  stepUpExpiresAt?: number;
  jti?: string;
  typ?: 'access' | 'email-verify' | 'password-reset';
}

const issuer = 'pet-match-care';

export const signAccessToken = (
  payload: Omit<AuthPayload, 'iat' | 'exp' | 'iss' | 'typ' | 'jti'>,
  ttl: string = env.JWT_ACCESS_TTL,
): { token: string; jti: string; expiresAt: Date } => {
  const jti = randomUUID();
  const token = jwt.sign({ ...payload, jti, typ: 'access' } as AuthPayload, env.JWT_SECRET, {
    expiresIn: ttl as SignOptions['expiresIn'],
    issuer,
  });
  const decoded = jwt.decode(token) as AuthPayload;
  const expiresAt = new Date((decoded.exp ?? 0) * 1000);
  return { token, jti, expiresAt };
};

export const verifyAuthToken = (token: string): AuthPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET, { issuer }) as AuthPayload;
  if (!decoded.sub || !decoded.role) throw new Error('Malformed token');
  return decoded;
};

export const signVerificationToken = (userId: string, email: string, ttl = env.JWT_VERIFICATION_TTL): string => {
  return jwt.sign({ sub: userId, email, typ: 'email-verify' } as AuthPayload, env.JWT_SECRET, {
    expiresIn: ttl as SignOptions['expiresIn'],
    issuer,
  });
};

export const signPasswordResetToken = (userId: string, ttl = env.JWT_PASSWORD_RESET_TTL): string => {
  return jwt.sign({ sub: userId, typ: 'password-reset' } as AuthPayload, env.JWT_SECRET, {
    expiresIn: ttl as SignOptions['expiresIn'],
    issuer,
  });
};

export const decodeTokenForInspection = (token: string): AuthPayload | null => {
  try {
    return jwt.verify(token, env.JWT_SECRET, { issuer }) as AuthPayload;
  } catch {
    return null;
  }
};

export const isStepUpFresh = (p: AuthPayload): boolean => {
  if (!p.amr?.includes('totp') || !p.stepUpExpiresAt) return false;
  return p.stepUpExpiresAt * 1000 > Date.now();
};
