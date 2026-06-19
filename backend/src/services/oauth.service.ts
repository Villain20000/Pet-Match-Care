import { env } from '@/config/env';

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
 */
export const exchangeGoogleCode = async (code: string, redirectUri: string): Promise<GoogleProfile> => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET δεν έχουν οριστεί');
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
    const body = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${tokenRes.status} ${body}`);
  }

  const tokens = (await tokenRes.json()) as GoogleTokenResponse;

  const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!infoRes.ok) {
    throw new Error(`Google userinfo failed: ${infoRes.status}`);
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
