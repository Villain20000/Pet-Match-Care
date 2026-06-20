import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  CORS_ORIGIN: z.string().default('*'),

  // --- Auth ---
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  JWT_VERIFICATION_TTL: z.string().default('30m'),
  JWT_PASSWORD_RESET_TTL: z.string().default('30m'),
  JWT_STEP_UP_TTL: z.string().default('5m'),
  BCRYPT_ROUNDS: z.coerce.number().int().positive().default(12),
  TOTP_ISSUER: z.string().default('Pet-Match & Care'),

  // --- Encryption (for TOTP secret at rest) ---
  TOTP_SECRET_ENC_KEY: z
    .string()
    .min(32, 'TOTP_SECRET_ENC_KEY must be ≥32 chars (≈32 bytes hex)')
    .default('dev-only-key-please-rotate-in-production-32'),

  // --- Firebase Cloud Messaging ---
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional().default(''),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional().default(''),

  // --- Geofencing ---
  POISON_ALERT_RADIUS_KM: z.coerce.number().positive().default(2),
  POISON_ALERT_TTL_HOURS: z.coerce.number().int().positive().default(48),
  STRAY_REPORT_TTL_DAYS: z.coerce.number().int().positive().default(14),
  LOST_PET_MATCH_RADIUS_KM: z.coerce.number().positive().default(5),

  // --- Storytelling: seed data ---
  GREEK_MUNICIPALITIES: z.string().min(1),

  // --- Google SSO ---
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  OAUTH_REDIRECT_BASE: z.string().default('petmatchcare://oauth'),

  // --- Email ---
  // Pick the active transport. 'smtp' is the prod one (Mailtrap or any
  // real SMTP). 'preview' stores messages in memory /api/_dev/email-preview
  // for inspection without leaving the dev machine. 'log' just prints.
  // A loud assertion fires if NODE_ENV=production + non-'smtp' is set.
  MAIL_TRANSPORT: z.enum(['smtp', 'log', 'preview']).default('log'),
  EMAIL_FROM: z.string().default('Pet-Match & Care <hello@petmatchcare.gr>'),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  SMTP_SECURE: z.coerce.boolean().default(false),

  // Optional — when set, a richly-styled inline banner is appended.
  APP_PUBLIC_URL: z.string().default('https://app.petmatchcare.gr'),

  // --- Dev preview endpoint guard ---
  DEV_EMAIL_PREVIEW_TOKEN: z.string().optional().default(''),

  // --- Stripe ---
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),

  // --- Frontend ---
  APP_DEEP_LINK_SCHEME: z.string().default('petmatchcare'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
   
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type AppEnv = typeof env;
