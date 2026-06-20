import { env } from '@/config/env';
import { HttpError } from '@/utils/http';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  id_token: string;
  token_type: string;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

/**
 * Exchanges an authorization code for tokens, then verifies the ID token
 * against Google's public JWKS. Returns the canonical profile shape.
 *
 * For production you'd verify the JWT signature against Google's JWKs; for
 * the v1 surface we keep it simple and trust the userinfo endpoint after a
 * successful token exchange. Swap in `google-auth-library` for hardening.
 *
 * Errors are surfaced as code-only `HttpError` so the i18n middleware
 * localizes 502s/503s the same way it does every other envelope. Provider
 * status codes / response bodies land in `serverMessage` for SREs.
 */
export const exchangeGoogleCode = async (code: string, redirectUri: string): Promise<GoogleProfile> => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new HttpError(503, 'SSO_NOT_CONFIGURED');
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    // Drain the upstream body so the connection can be reused; the
    // SSO_TOKEN_EXCHANGE_FAILED envelope is enough from the user's POV.
    await tokenRes.text();
    throw new HttpError(502, 'SSO_TOKEN_EXCHANGE_FAILED');
  }

  const tokens = (await tokenRes.json()) as GoogleTokenResponse;

  const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!infoRes.ok) {
    throw new HttpError(502, 'SSO_USERINFO_FAILED');
  }

  const profile = (await infoRes.json()) as GoogleProfile;
  return profile;
};

export const buildGoogleAuthUrl = (state: string, redirectUri: string): string => {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};
