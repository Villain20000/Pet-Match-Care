import admin from 'firebase-admin';
import { env } from '@/config/env';

let app: admin.app.App | null = null;

const initialize = (): admin.app.App | null => {
  if (app) return app;

  try {
    if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const credentials = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
      app = admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
      return app;
    }

    if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const credentials = require(env.FIREBASE_SERVICE_ACCOUNT_PATH);
      app = admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
      return app;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('⚠️  Firebase initialization failed, falling back to dry-run:', err);
    return null;
  }

  // eslint-disable-next-line no-console
  console.warn(
    '⚠️  Firebase credentials missing — push notifications will be logged, not sent.',
  );
  return null;
};

initialize();

export interface PoisonAlertPushPayload {
  alertId: string;
  latitude: number;
  longitude: number;
  addressHint?: string;
  description?: string;
  distanceKm: number;
}

/**
 * Sends a HIGH-priority Android push to a single device.
 * If Firebase Admin isn't configured, it prints the payload instead.
 */
export const sendPoisonAlertPush = async (
  pushToken: string,
  payload: PoisonAlertPushPayload,
): Promise<{ ok: boolean; dryRun: boolean; messageId?: string }> => {
  const message: admin.messaging.Message = {
    token: pushToken,
    // android.priority must be "high" so the alert breaches Doze and shows
    // an intrusive heads-up notification immediately.
    android: {
      priority: 'high',
      ttl: env.POISON_ALERT_TTL_HOURS * 60 * 60 * 1000, // ms
      notification: {
        channelId: 'poison_alerts_high',
        priority: admin.messaging.AndroidNotificationPriority.MAX,
        sound: 'poison_alert.wav',
        vibrateTimings: [0, 400, 200, 400, 200, 600],
        clickAction: 'OPEN_MAP_SCREEN',
        tag: `poison-${payload.alertId}`,
      },
    },
    notification: {
      title: '🚨 Φόλα κοντά σου!',
      body: payload.addressHint
        ? `${payload.addressHint} — ${payload.distanceKm.toFixed(2)} χλμ. μακριά`
        : `Αναφορά φόλας ${payload.distanceKm.toFixed(2)} χλμ. μακριά`,
    },
    data: {
      alertId: payload.alertId,
      latitude: String(payload.latitude),
      longitude: String(payload.longitude),
      addressHint: payload.addressHint ?? '',
      description: payload.description ?? '',
      distanceKm: String(payload.distanceKm),
      type: 'POISON_ALERT',
    },
  };

  if (!app) {
    // eslint-disable-next-line no-console
    console.log('[FCM dry-run] Would send:', JSON.stringify(message));
    return { ok: true, dryRun: true };
  }

  try {
    const messageId = await admin.messaging().send(message);
    return { ok: true, dryRun: false, messageId };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[FCM] send failed:', err);
    return { ok: false, dryRun: false };
  }
};

/**
 * Fan-out helper: pushes the same poison alert to many devices, in parallel.
 * Skips silently for tokens without pushToken. Failures are logged, not thrown.
 */
export const sendPoisonAlertPushToMany = async (
  tokens: string[],
  payload: PoisonAlertPushPayload,
): Promise<{ delivered: number; failed: number; dryRun: number }> => {
  if (tokens.length === 0) {
    return { delivered: 0, failed: 0, dryRun: 0 };
  }

  const results = await Promise.all(
    tokens.map((token) => sendPoisonAlertPush(token, payload)),
  );

  return results.reduce(
    (acc, r) => {
      if (r.dryRun) acc.dryRun += 1;
      else if (r.ok) acc.delivered += 1;
      else acc.failed += 1;
      return acc;
    },
    { delivered: 0, failed: 0, dryRun: 0 },
  );
};

export const isFcmConfigured = (): boolean => app !== null;
