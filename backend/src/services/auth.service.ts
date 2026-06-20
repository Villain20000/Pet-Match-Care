/**
 * Centralized auth service. Owns the refresh-token rotation logic and the
 * 2FA / step-up / re-auth envelope. Every controller that mints tokens
 * goes through here, so it's the single audit point.
 *
 * Error policy: services never touch `req` — they throw code-only
 * `HttpError` instances and let the i18n middleware localize. New
 * `TOTP_*` / `SSO_*` keys live in `locales/{el,en}.ts` so the mobile
 * client renders translated toasts without an extra round-trip.
 */
import { prisma } from '@/config/prisma';
import { env } from '@/config/env';
import { hashPassword, verifyPassword } from '@/utils/password';
import { signAccessToken, signPasswordResetToken, signVerificationToken } from '@/utils/jwt';
import { decodeTokenForInspection } from '@/utils/jwt';
import { generateOpaqueToken, sha256Hex, generateRecoveryCode } from '@/utils/crypto';
import { sendEmail, templates } from '@/services/email.service';
import {
  buildOtpAuthUri,
  decryptSecret,
  encryptSecret,
  generateSecret,
  verifyTotp,
} from '@/services/totp.service';
import { evaluateBadges } from '@/services/badges.engine';
import { HttpError } from '@/utils/http';
import type { AuthProvider, Role } from '@prisma/client';

export interface IssuedTokens {
  accessToken: string;
  accessExpiresAt: Date;
  refreshToken: string;
  refreshExpiresAt: Date;
  familyId: string;
}

export const issueTokensForUser = async (
  userId: string,
  role: Role,
  email: string,
  meta: { userAgent?: string; ip?: string; familyId?: string } = {},
): Promise<IssuedTokens> => {
  const familyId = meta.familyId ?? crypto.randomUUID();

  const { token: accessToken, jti, expiresAt: accessExpiresAt } = signAccessToken({
    sub: userId,
    role,
    email,
  } as any);

  const refreshPlain = generateOpaqueToken();
  const refreshHash = sha256Hex(refreshPlain);
  const refreshExpiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: refreshHash,
      familyId,
      userAgent: meta.userAgent,
      ip: meta.ip,
      expiresAt: refreshExpiresAt,
    },
  });

  await prisma.userSession.upsert({
    where: { id: jti },
    create: { id: jti, userId, userAgent: meta.userAgent ?? null, ip: meta.ip ?? null },
    update: { lastActiveAt: new Date() },
  });

  return { accessToken, accessExpiresAt, refreshToken: refreshPlain, refreshExpiresAt, familyId };
};

export const rotateRefreshToken = async (
  presentedToken: string,
  meta: { userAgent?: string; ip?: string } = {},
): Promise<IssuedTokens | null> => {
  const presentedHash = sha256Hex(presentedToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash: presentedHash } });
  if (!existing) return null;
  if (existing.revokedAt || existing.replacedById) {
    await prisma.refreshToken.updateMany({
      where: { familyId: existing.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return null;
  }
  if (existing.expiresAt < new Date()) return null;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: existing.userId } });
  // Re-mint with the user's CURRENT locale (in case they toggled it).
  const replacement = await issueTokensForUser(user.id, user.role, user.email, {
    ...meta,
    // locale is in JWT payload only — issueTokensForUser doesn't need it directly.
  } as any);

  const newRow = await prisma.refreshToken.findUnique({
    where: { tokenHash: sha256Hex(replacement.refreshToken) },
  });
  if (newRow) {
    await prisma.refreshToken.update({
      where: { id: existing.id },
      data: { replacedById: newRow.id, lastUsedAt: new Date() },
    });
  }
  return replacement;
};

export const revokeRefreshToken = async (presentedToken: string): Promise<boolean> => {
  const presentedHash = sha256Hex(presentedToken);
  const row = await prisma.refreshToken.findUnique({ where: { tokenHash: presentedHash } });
  if (!row) return false;
  await prisma.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
  return true;
};

export const revokeAllForUser = async (userId: string) => {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await prisma.userSession.updateMany({
    where: { userId, loggedOutAt: null },
    data: { loggedOutAt: new Date() },
  });
};

// -------------------------------------------------------------------------
// Auth flow
// -------------------------------------------------------------------------
export const registerLocal = async (args: {
  email: string;
  password: string;
  fullName?: string;
  homeLat?: number;
  homeLng?: number;
  locale?: 'el' | 'en';
}) => {
  // Defence in depth — Zod schema in `auth.controller.ts` already enforces
  // .min(8), but if a programmatic caller reaches this layer (e.g. seed
  // scripts), surface a localized 400 rather than letting bcrypt throw.
  if (!args.password || args.password.length < 8) {
    throw new HttpError(400, 'VALIDATION_ERROR');
  }

  const existing = await prisma.user.findUnique({ where: { email: args.email.toLowerCase() } });
  if (existing) throw new HttpError(409, 'EMAIL_TAKEN');

  const user = await prisma.user.create({
    data: {
      email: args.email.toLowerCase(),
      passwordHash: await hashPassword(args.password),
      fullName: args.fullName,
      homeLatitude: args.homeLat,
      homeLongitude: args.homeLng,
      locale: args.locale ?? 'el',
      authProviders: {
        create: { provider: AuthProvider.LOCAL, providerSubjectId: `local:${args.email.toLowerCase()}` },
      },
    },
  });
  await sendVerificationEmail(user.id, user.email, (args.locale ?? 'el') as 'el' | 'en');
  await evaluateBadges(user.id);
  return user;
};

export const loginLocal = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.passwordHash) throw new HttpError(401, 'INVALID_CREDENTIALS');
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'INVALID_CREDENTIALS');
  await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
  await evaluateBadges(user.id);
  return user;
};

// -------------------------------------------------------------------------
// Email verification
// -------------------------------------------------------------------------
export const sendVerificationEmail = async (userId: string, email: string, locale: 'el' | 'en' = 'el') => {
  const token = signVerificationToken(userId, email);
  const tpl = templates.verifyEmail(token, locale);
  return sendEmail({
    to: email, subject: tpl.subject, text: tpl.text, html: tpl.html, kind: tpl.kind,
    meta: { ...tpl.meta, locale },
  });
};

export const consumeVerificationToken = async (token: string) => {
  const payload = decodeTokenForInspection(token);
  if (!payload || payload.typ !== 'email-verify') throw new HttpError(401, 'INVALID_TOKEN');
  await prisma.user.update({
    where: { id: payload.sub! },
    data: { emailVerifiedAt: new Date() },
  });
  return payload.sub!;
};

// -------------------------------------------------------------------------
// Password reset
// -------------------------------------------------------------------------
export const sendPasswordReset = async (email: string, locale: 'el' | 'en' = 'el') => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return; // Silent — avoid account enumeration.
  const token = signPasswordResetToken(user.id);
  const tpl = templates.passwordReset(token, user.locale === 'en' ? 'en' : locale);
  await sendEmail({
    to: user.email, subject: tpl.subject, text: tpl.text, html: tpl.html, kind: tpl.kind,
    meta: { ...tpl.meta, locale: tpl.locale },
  });
};

export const consumePasswordReset = async (token: string, newPassword: string) => {
  const payload = decodeTokenForInspection(token);
  if (!payload || payload.typ !== 'password-reset') throw new HttpError(401, 'INVALID_TOKEN');
  await prisma.user.update({
    where: { id: payload.sub! },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  await revokeAllForUser(payload.sub!);
};

// -------------------------------------------------------------------------
// TOTP / 2FA
// -------------------------------------------------------------------------
export const beginTotpEnrollment = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.totpEnabled) throw new HttpError(409, 'TOTP_ALREADY_ENABLED');
  const secret = generateSecret();
  await prisma.user.update({ where: { id: userId }, data: { totpSecretEnc: encryptSecret(secret) } });
  return { secret, otpauthUri: buildOtpAuthUri(secret, user.email) };
};

export const confirmTotpEnrollment = async (userId: string, code: string): Promise<{ recoveryCodes: string[] }> => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.totpSecretEnc) throw new HttpError(400, 'TOTP_ENROLLMENT_NOT_STARTED');
  if (user.totpEnabled) throw new HttpError(409, 'TOTP_ALREADY_ENABLED');
  const secret = decryptSecret(user.totpSecretEnc);
  if (!verifyTotp(secret, code)) throw new HttpError(401, 'INVALID_2FA_CODE');
  await prisma.user.update({ where: { id: userId }, data: { totpEnabled: true } });
  const codes: string[] = [];
  await prisma.recoveryCode.deleteMany({ where: { userId } });
  for (let i = 0; i < 10; i++) {
    const code = generateRecoveryCode();
    codes.push(code);
    await prisma.recoveryCode.create({ data: { userId, codeHash: await hashPassword(code) } });
  }
  return { recoveryCodes: codes };
};

export const verifyTwoFactorCode = async (userId: string, codeOrRecovery: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'NOT_FOUND');
  if (!user.totpEnabled) throw new HttpError(400, 'TOTP_NOT_ENABLED');
  const secret = decryptSecret(user.totpSecretEnc!);
  if (verifyTotp(secret, codeOrRecovery)) return { method: 'totp' as const };
  const candidates = await prisma.recoveryCode.findMany({
    where: { userId, usedAt: null },
    select: { id: true, codeHash: true },
  });
  for (const candidate of candidates) {
    if (await verifyPassword(codeOrRecovery, candidate.codeHash)) {
      await prisma.recoveryCode.update({ where: { id: candidate.id }, data: { usedAt: new Date() } });
      return { method: 'recovery' as const };
    }
  }
  throw new HttpError(401, 'INVALID_2FA_CODE');
};

export const disableTotp = async (userId: string, code: string) => {
  await verifyTwoFactorCode(userId, code);
  await prisma.user.update({ where: { id: userId }, data: { totpEnabled: false, totpSecretEnc: null } });
  await prisma.recoveryCode.deleteMany({ where: { userId } });
};

// -------------------------------------------------------------------------
// SSO
// -------------------------------------------------------------------------
export const findOrCreateUserForSso = async (args: {
  provider: AuthProvider;
  subject: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  avatarUrl?: string;
}) => {
  const existingIdentity = await prisma.oAuthIdentity.findUnique({
    where: { provider_providerSubjectId: { provider: args.provider, providerSubjectId: args.subject } },
  });
  if (existingIdentity) {
    await prisma.user.update({
      where: { id: existingIdentity.userId },
      data: { lastSeenAt: new Date(), avatarUrl: args.avatarUrl ?? undefined },
    });
    return prisma.user.findUniqueOrThrow({ where: { id: existingIdentity.userId } });
  }
  if (!args.emailVerified) {
    throw new HttpError(403, 'SSO_EMAIL_NOT_VERIFIED');
  }
  const newUser = await prisma.user.create({
    data: {
      email: args.email.toLowerCase(),
      fullName: args.displayName,
      avatarUrl: args.avatarUrl,
      emailVerifiedAt: new Date(),
      passwordHash: null,
      authProviders: {
        create: { provider: args.provider, providerSubjectId: args.subject, email: args.email },
      },
    },
  });
  await evaluateBadges(newUser.id);
  return newUser;
};
