import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthProvider } from '@prisma/client';
import { throwHttp } from "@/middlewares/error";
import { exchangeGoogleCode, buildGoogleAuthUrl } from '@/services/oauth.service';
import { findOrCreateUserForSso, issueTokensForUser } from '@/services/auth.service';
import { env } from '@/config/env';

/**
 * GET /api/auth/oauth/google/start?redirect=/welcome
 * Returns { authUrl, state } — the mobile client opens the URL in the
 * in-app browser and waits for a deep-link callback.
 */
export const startGoogle = async (req: Request, res: Response) => {
  if (!env.GOOGLE_CLIENT_ID) {
    throwHttp(req, 503, 'SSO_NOT_CONFIGURED');
  }
  const state = Math.random().toString(36).slice(2);
  // The redirect_uri of Google's OAuth dance is OUR backend callback —
  // the *final* redirect back to the app is done from the callback.
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/oauth/google/callback`;
  const authUrl = buildGoogleAuthUrl(state, redirectUri);
  return res.json({ authUrl, state });
};

/**
 * GET /api/auth/oauth/google/callback?code=&state=
 * Completes the OAuth handshake, mints tokens, then redirects the
 * browser into the mobile app via the configured `petmatchcare://`
 * scheme. The mobile `expo-auth-session` flow picks up the URL with
 * the tokens in the fragment and inserts them into SecureStore.
 *
 * (We intentionally DO NOT return JSON here — the WebBrowser session
 * is unlikely to have JS that consumes JSON.)
 */
export const callbackGoogle = async (req: Request, res: Response) => {
  const { code, error } = z
    .object({
      code: z.string().min(8).optional(),
      error: z.string().optional(),
    })
    .parse(req.query);
  if (error) {
    return res.redirect(`${env.OAUTH_REDIRECT_BASE}?error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    throwHttp(req, 400, 'MISSING_CODE');
  }

  const backendUrl = `${req.protocol}://${req.get('host')}`;
  const redirectUri = `${backendUrl}/api/auth/oauth/google/callback`;
  const profile = await exchangeGoogleCode(code, redirectUri);
  const user = await findOrCreateUserForSso({
    provider: AuthProvider.GOOGLE,
    subject: profile.sub,
    email: profile.email,
    emailVerified: !!profile.email_verified,
    displayName: profile.name,
    avatarUrl: profile.picture,
  });
  const tokens = await issueTokensForUser(user.id, user.role, user.email, {
    userAgent: req.headers['user-agent'] as string | undefined,
    ip: req.ip,
  });

  const userJson = encodeURIComponent(
    JSON.stringify({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      karmaPoints: user.karmaPoints,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      totpEnabled: user.totpEnabled,
    }),
  );

  return res.redirect(
    `${env.OAUTH_REDIRECT_BASE}#access=${tokens.accessToken}` +
      `&refresh=${tokens.refreshToken}` +
      `&expiresAt=${encodeURIComponent(tokens.accessExpiresAt.toISOString())}` +
      `&user=${userJson}`,
  );
};
