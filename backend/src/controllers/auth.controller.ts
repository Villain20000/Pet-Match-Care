import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@/config/prisma';
import { signAccessToken } from '@/utils/jwt';
import type { IssuedTokens } from '@/services/auth.service';
import {
  consumePasswordReset,
  consumeVerificationToken,
  issueTokensForUser,
  loginLocal,
  registerLocal,
  revokeAllForUser,
  revokeRefreshToken,
  rotateRefreshToken,
  sendPasswordReset,
  sendVerificationEmail,
  verifyTwoFactorCode,
} from '@/services/auth.service';
import { throwHttp } from '@/utils/http';
import { templates } from '@/services/email.service';
import type { UserDto } from '@/types';
import { env } from '@/config/env';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(80).optional(),
  homeLatitude: z.coerce.number().min(-90).max(90).optional(),
  homeLongitude: z.coerce.number().min(-180).max(180).optional(),
  locale: z.enum(['el', 'en']).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const VerifySchema = z.object({ token: z.string().min(8) });
const ForgotSchema = z.object({ email: z.string().email() });
const ResetSchema = z.object({ token: z.string().min(8), newPassword: z.string().min(8) });
const StepUpSchema = z.object({ code: z.string().min(6).max(10) });
const UpdatePushTokenSchema = z.object({ pushToken: z.string().min(10) });
const UpdateMeSchema = z.object({
  fullName: z.string().min(2).max(80).optional(),
  locale: z.enum(['el', 'en']).optional(),
  homeLatitude: z.coerce.number().optional(),
  homeLongitude: z.coerce.number().optional(),
  avatarUrl: z.string().url().optional(),
});

const sanitizeUser = (u: {
  id: string; email: string; fullName: string | null; avatarUrl: string | null; role: any;
  karmaPoints: number; emailVerifiedAt: Date | null; totpEnabled: boolean; pushToken: string | null; locale: string;
}): UserDto => ({
  id: u.id, email: u.email, fullName: u.fullName, avatarUrl: u.avatarUrl ?? null,
  role: u.role, karmaPoints: u.karmaPoints,
  emailVerifiedAt: u.emailVerifiedAt?.toISOString() ?? null,
  totpEnabled: u.totpEnabled, pushToken: u.pushToken,
  locale: (u.locale as 'el' | 'en') ?? 'el',
});

const clientMeta = (req: Request) => ({
  userAgent: req.headers['user-agent'] as string | undefined,
  ip: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip,
});

const tokensResponse = (t: IssuedTokens) => ({
  accessToken: t.accessToken,
  accessExpiresAt: t.accessExpiresAt.toISOString(),
  refreshToken: t.refreshToken,
  refreshExpiresAt: t.refreshExpiresAt.toISOString(),
});

export const register = async (req: Request, res: Response) => {
  const input = RegisterSchema.parse(req.body);

  try {
    await registerLocal({
      email: input.email,
      password: input.password,
      fullName: input.fullName,
      homeLat: input.homeLatitude,
      homeLng: input.homeLongitude,
    });
  } catch (err) {
    // Re-leak anything that isn't a unique-constraint violation so that
    // real DB outages still surface to ops (not swallowed as EMAIL_TAKEN).
    const code = (err as { code?: string } | null)?.code;
    if (code !== 'P2002') throw err;
    throwHttp(req, 409, 'EMAIL_TAKEN');
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { email: input.email.toLowerCase() } });
  if (input.locale && input.locale !== user.locale) {
    await prisma.user.update({ where: { id: user.id }, data: { locale: input.locale } });
  }
  const effective = input.locale ?? user.locale;
  const tokens = await issueTokensForUser(
    user.id,
    user.role,
    user.email,
    { ...clientMeta(req), locale: effective } as any,
  );
  return res.status(201).json({
    ...tokensResponse(tokens!),
    user: sanitizeUser({ ...user, locale: effective }),
  });
};

export const login = async (req: Request, res: Response) => {
  const input = LoginSchema.parse(req.body);
  const user = await loginLocal(input.email, input.password);

  const tokens = await issueTokensForUser(
    user.id,
    user.role,
    user.email,
    { ...clientMeta(req), locale: user.locale } as any,
  );
  return res.json({
    ...tokensResponse(tokens!),
    user: sanitizeUser(user),
    requires2fa: user.totpEnabled,
  });
};

export const refresh = async (req: Request, res: Response) => {
  const RefreshSchema = z.object({ refreshToken: z.string().min(20) });
  const { refreshToken } = RefreshSchema.parse(req.body);

  const rotated = await rotateRefreshToken(refreshToken, clientMeta(req));
  if (!rotated) {
    throwHttp(req, 401, 'REFRESH_REJECTED');
  }
  return res.json(tokensResponse(rotated!));
};

export const logout = async (req: Request, res: Response) => {
  const LogoutSchema = z.object({ refreshToken: z.string().min(20).optional() });
  const { refreshToken } = LogoutSchema.parse(req.body ?? {});
  if (refreshToken) await revokeRefreshToken(refreshToken);
  return res.json({ success: true });
};

export const logoutEverywhere = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  await revokeAllForUser(req.user!.sub);
  return res.json({ success: true });
};

export const me = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.sub } });
  return res.json({ user: sanitizeUser(user) });
};

export const updateMe = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const input = UpdateMeSchema.parse(req.body);

  const data: Record<string, unknown> = {};
  if (typeof input.fullName === 'string') data.fullName = input.fullName;
  if (typeof input.locale === 'string') data.locale = input.locale;
  if (typeof input.avatarUrl === 'string') data.avatarUrl = input.avatarUrl;
  if (typeof input.homeLatitude === 'number') data.homeLatitude = input.homeLatitude;
  if (typeof input.homeLongitude === 'number') data.homeLongitude = input.homeLongitude;

  const updated = await prisma.user.update({ where: { id: req.user!.sub }, data });
  return res.json({ user: sanitizeUser(updated) });
};

export const updatePushToken = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const { pushToken } = UpdatePushTokenSchema.parse(req.body);
  await prisma.user.update({ where: { id: req.user!.sub }, data: { pushToken } });
  return res.json({ success: true });
};

const userLocale = (user: { locale?: string }) => (user.locale === 'en' ? 'en' : 'el');

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = VerifySchema.parse(req.body);
  await consumeVerificationToken(token);
  return res.json({ success: true });
};

export const resendVerification = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.sub } });
  await sendVerificationEmail(user.id, user.email, userLocale(user));
  return res.json({ success: true });
};

export const forgot = async (req: Request, res: Response) => {
  const { email } = ForgotSchema.parse(req.body);
  await sendPasswordReset(email, userLocale({ locale: req.locale }));
  return res.json({ success: true });
};

export const reset = async (req: Request, res: Response) => {
  const input = ResetSchema.parse(req.body);
  await consumePasswordReset(input.token, input.newPassword);
  return res.json({ success: true });
};

export const stepUp = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const { code } = StepUpSchema.parse(req.body);

  await verifyTwoFactorCode(req.user!.sub, code);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.sub } });
  const stepUpTtl = env.JWT_STEP_UP_TTL;
  const expiresAtSeconds = Math.floor(Date.now() / 1000) + parseTtlSeconds(stepUpTtl);
  const { token: accessToken, jti, expiresAt } = signAccessToken(
    {
      sub: user.id, email: user.email, role: user.role,
      amr: ['totp', 'pwd', ...(Array.isArray(req.user!.amr) ? req.user!.amr.filter((m) => m !== 'totp') : [])],
      stepUpExpiresAt: expiresAtSeconds,
      locale: user.locale as 'el' | 'en',
    } as any,
    stepUpTtl,
  );
  void jti; void expiresAt;
  return res.json({ accessToken, accessExpiresAt: new Date(expiresAtSeconds * 1000).toISOString(), ttlSeconds: parseTtlSeconds(stepUpTtl) });
};

export const listSessions = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const sessions = await prisma.userSession.findMany({
    where: { userId: req.user!.sub, loggedOutAt: null },
    orderBy: { lastActiveAt: 'desc' },
    take: 20,
  });
  return res.json({ sessions });
};

const parseTtlSeconds = (ttl: string): number => {
  const m = /^(\d+)([smhd])$/.exec(ttl);
  if (!m) return 300;
  const n = Number(m[1]);
  const unit = m[2];
  return n * ({ s: 1, m: 60, h: 3600, d: 86400 } as Record<string, number>)[unit]!;
};
export { parseTtlSeconds };

// templates is imported so callers can compose deep-link payloads with the
// same template the email service uses; keep the symbol referenced.
void templates;
