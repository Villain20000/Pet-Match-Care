/**
 * Deep-link URL builders. Every email CTA encodes either a mobile-app
 * deep link (preferred) or a public web fallback. Tapping the link on
 * Android dispatches `ACTION_VIEW` with our scheme and the app picks it
 * up via React Navigation's `linking` config + the `Linking` module.
 */
import { env } from '@/config/env';

export const deeplinks = {
  verifyEmail: (token: string): string =>
    `${env.APP_DEEP_LINK_SCHEME}://verify-email?token=${encodeURIComponent(token)}`,
  passwordReset: (token: string): string =>
    `${env.APP_DEEP_LINK_SCHEME}://reset-password?token=${encodeURIComponent(token)}`,
  adoptionStatus: (applicationId: string): string =>
    `${env.APP_DEEP_LINK_SCHEME}://application/${encodeURIComponent(applicationId)}`,
  publicFallback: {
    verifyEmail: (token: string): string =>
      `${env.APP_PUBLIC_URL}/verify-email?token=${encodeURIComponent(token)}`,
    passwordReset: (token: string): string =>
      `${env.APP_PUBLIC_URL}/reset-password?token=${encodeURIComponent(token)}`,
  },
};
