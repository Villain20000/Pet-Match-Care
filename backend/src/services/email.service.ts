/**
 * Email service v2 — three transports behind one interface, now locale-aware.
 *
 * Pick the active transport. Render the active template set against the
 * server-side catalog (services/locales). Greek is the source of truth;
 * missing keys fall through to it.
 */
import { env } from '@/config/env';
import { deeplinks } from '@/utils/deeplinks';
import nodemailer, { type Transporter } from 'nodemailer';
import { el as elLocale, type ServerPane } from '@/locales/el';
import { en as enLocale } from '@/locales/en';

type Locale = 'el' | 'en';
const CATALOGS: Record<Locale, ServerPane> = { el: elLocale, en: enLocale };

const resolveKey = (locale: Locale, dotted: string): string => {
  const seg = dotted.split('.');
  const tryLocale = (l: Locale) => {
    let obj: unknown = CATALOGS[l];
    for (const s of seg) {
      if (obj && typeof obj === 'object' && s in (obj as Record<string, unknown>)) {
        obj = (obj as Record<string, unknown>)[s];
      } else return undefined;
    }
    return typeof obj === 'string' ? obj : undefined;
  };
  return tryLocale(locale) ?? tryLocale('el') ?? dotted;
};

const substitute = (s: string, vars?: Record<string, string | number>): string => {
  if (!vars) return s;
  return s.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? `{{${k}}}`));
};

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------
export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
  kind: EmailKind;
  meta?: Record<string, unknown>;
}

export type EmailKind = 'verifyEmail' | 'passwordReset' | 'adoptionStatus' | 'general';

export interface EmailSendResult {
  delivered: boolean;
  transport: 'smtp' | 'log' | 'preview';
  messageId?: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// HTML infrastructure
// ---------------------------------------------------------------------------
const COLORS = {
  terracotta: '#E07A5F',
  crimson: '#E63946',
  cream: '#F4F1DE',
  charcoal: '#2F3E46',
  white: '#FFFFFF',
};

const escapeHtml = (s: unknown): string =>
  s === null || s === undefined
    ? ''
    : String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

interface BaseArgs {
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  isDestructive?: boolean;
  fallbackLine?: string;
}

const renderBaseEmail = (a: BaseArgs): string => `<!doctype html>
<html lang="${a.title ? 'el' : 'en'}">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(a.title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLORS.cream};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${COLORS.charcoal};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.cream};padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:${COLORS.white};border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
          <tr>
            <td style="background-color:${a.isDestructive ? COLORS.crimson : COLORS.terracotta};padding:24px;text-align:center;color:${COLORS.white};">
              <div style="font-size:32px;line-height:1;margin-bottom:8px;">🐾</div>
              <div style="font-size:22px;font-weight:700;letter-spacing:-0.3px;">Pet-Match & Care</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 24px 28px;">
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:${COLORS.charcoal};">${escapeHtml(a.title)}</h1>
              <div style="font-size:15px;line-height:1.6;color:${COLORS.charcoal};">${a.body}</div>
              ${a.ctaText && a.ctaUrl ? `
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px auto 16px auto;">
                <tr><td style="border-radius:12px;background-color:${a.isDestructive ? COLORS.crimson : COLORS.terracotta};">
                  <a href="${escapeHtml(a.ctaUrl)}" target="_blank" style="display:inline-block;color:${COLORS.white};font-weight:700;text-decoration:none;padding:14px 24px;border-radius:12px;font-size:14px;letter-spacing:0.4px;">${escapeHtml(a.ctaText)}</a>
                </td></tr>
              </table>
              <div style="font-size:12px;color:#7a868d;text-align:center;">${escapeHtml(a.fallbackLine ?? '')}<br/>
                <a href="${escapeHtml(a.ctaUrl ?? '')}" style="color:${COLORS.terracotta};word-break:break-all;">${escapeHtml(a.ctaUrl ?? '')}</a>
              </div>
              ` : ''}
            </td>
          </tr>
          <tr>
            <td style="background-color:${COLORS.cream};padding:20px 28px;text-align:center;border-top:1px solid #E8E4C9;">
              <div style="font-size:12px;color:#7a868d;">${escapeHtml('Pet-Match & Care')}</div>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

// ---------------------------------------------------------------------------
// Locale-aware templates
// ---------------------------------------------------------------------------
const escape = (s: string) => escapeHtml(s);

export const templates = {
  verifyEmail: (token: string, locale: Locale = 'el') => {
    const t = (k: string) => resolveKey(locale, k);
    const mobileUrl = `${env.APP_DEEP_LINK_SCHEME}://verify-email?token=${encodeURIComponent(token)}`;
    const webUrl = `${env.APP_PUBLIC_URL}/verify-email?token=${encodeURIComponent(token)}`;
    return {
      kind: 'verifyEmail' as const,
      locale,
      subject: t('email.verifySubject'),
      text:
        `${locale === 'el' ? 'Καλώς ήρθες!\n\nΕπιβεβαίωσε τη διεύθυνσή σου: ' : 'Welcome!\n\nVerify your email: '}${mobileUrl}\n` +
        `${locale === 'el' ? 'Web fallback: ' : 'Web fallback: '}${webUrl}`,
      html: renderBaseEmail({
        title: t('email.verifyTitle'),
        body: `<p>${t('email.verifyBody')}</p><p style="margin-top:16px;">${t('email.verifyDisclaimer')}</p>`,
        ctaText: t('email.verifyCta'),
        ctaUrl: mobileUrl,
        fallbackLine: t('email.verifyFallback'),
      }),
      meta: { token, mobileUrl, webUrl, locale, ttlMinutes: 30 },
    };
  },

  passwordReset: (token: string, locale: Locale = 'el') => {
    const t = (k: string) => resolveKey(locale, k);
    const mobileUrl = `${env.APP_DEEP_LINK_SCHEME}://reset-password?token=${encodeURIComponent(token)}`;
    const webUrl = `${env.APP_PUBLIC_URL}/reset-password?token=${encodeURIComponent(token)}`;
    return {
      kind: 'passwordReset' as const,
      locale,
      subject: t('email.resetSubject'),
      text:
        (locale === 'el'
          ? `Λάβαμε αίτημα επαναφοράς κωδικού.\n\nΠάτα τον σύνδεσμο: `
          : `We received a password reset request.\n\nTap the link: `) +
        mobileUrl + '\n' +
        (locale === 'el' ? 'Web fallback: ' : 'Web fallback: ') + webUrl,
      html: renderBaseEmail({
        title: t('email.resetTitle'),
        body: `<p>${t('email.resetBody')}</p><p style="margin-top:16px;">${t('email.resetBodyContinued')}</p><p style="margin-top:16px;font-size:13px;color:#7a868d;">${t('email.resetDisclaimer')}</p>`,
        ctaText: t('email.resetCta'),
        ctaUrl: mobileUrl,
        fallbackLine: t('email.resetFallback'),
      }),
      meta: { token, mobileUrl, webUrl, locale, ttlMinutes: 30 },
    };
  },

  adoptionUpdate: (args: {
    username: string;
    petName: string;
    newState: string;
    applicationId: string;
    locale?: Locale;
  }) => {
    const locale: Locale = args.locale ?? 'el';
    const t = (k: string) => resolveKey(locale, k);
    const mobileUrl = deeplinks.adoptionStatus(args.applicationId);
    return {
      kind: 'adoptionStatus' as const,
      locale,
      subject: substitute(t('email.adoptionSubject'), { pet: escape(args.petName) }),
      text:
        (locale === 'el' ? `Γεια σου ${args.username},\n\n` : `Hi ${args.username},\n\n`) +
        (locale === 'el' ? `Υπάρχει ενημέρωση για τον/την ${args.petName}: ${args.newState}.` : `There is an update for ${args.petName}: ${args.newState}.`),
      html: renderBaseEmail({
        title: t('email.adoptionTitle'),
        body:
          `<p>${substitute(t('email.adoptionGreeting'), { username: escape(args.username) })}</p>` +
          `<p style="margin-top:16px;">${substitute(t('email.adoptionBody'), { pet: escape(args.petName) })}</p>` +
          `<p style="margin-top:16px;padding:16px;background-color:${COLORS.cream};border-radius:12px;font-weight:700;color:${COLORS.terracotta};">${escape(args.newState)}</p>`,
        ctaText: t('email.adoptionCta'),
        ctaUrl: mobileUrl,
      }),
      meta: { ...args, mobileUrl, locale },
    };
  },
};

// ---------------------------------------------------------------------------
// Transports (unchanged)
// ---------------------------------------------------------------------------
let smtpTransporter: Transporter | null = null;
const buildSmtpTransporter = (): Transporter | null => {
  if (smtpTransporter) return smtpTransporter;
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    return null;
  }
  smtpTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 2525,
    secure: (env.SMTP_PORT ?? 2525) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
  return smtpTransporter;
};

interface PreviewRow {
  id: string; to: string; subject: string; text: string; html: string;
  kind: EmailKind; locale: Locale; meta?: Record<string, unknown>; sentAt: string;
}
const PREVIEW_CAP = 50;
const previewInbox: PreviewRow[] = [];

const pushPreview = (row: PreviewRow): void => {
  previewInbox.unshift(row);
  if (previewInbox.length > PREVIEW_CAP) previewInbox.length = PREVIEW_CAP;
};

export const getPreviewInbox = (limit = 10): PreviewRow[] =>
  previewInbox.slice(0, Math.max(1, Math.min(limit, PREVIEW_CAP)));
export const clearPreviewInbox = (): void => {
  previewInbox.length = 0;
};

export const sendEmail = async (payload: EmailPayload): Promise<EmailSendResult> => {
  if (env.NODE_ENV === 'production' && env.MAIL_TRANSPORT !== 'smtp') {
    console.error('[email] BLOCKED: production with non-smtp transport', env.MAIL_TRANSPORT);
    return { delivered: false, transport: env.MAIL_TRANSPORT, reason: 'BLOCKED_PROD_NON_SMTP' };
  }

  switch (env.MAIL_TRANSPORT) {
    case 'smtp': {
      const t = buildSmtpTransporter();
      if (!t) return { delivered: false, transport: 'smtp', reason: 'NO_CREDENTIALS' };
      try {
        const info = await t.sendMail({
          from: env.EMAIL_FROM,
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
        });
        return { delivered: true, transport: 'smtp', messageId: info.messageId };
      } catch (err) {
        console.error('[email] smtp failure:', err instanceof Error ? err.message : err);
        return { delivered: false, transport: 'smtp', reason: 'SMTP_FAIL' };
      }
    }
    case 'preview': {
      const row: PreviewRow = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        kind: payload.kind,
        locale: (payload.meta?.locale as Locale) ?? 'el',
        meta: payload.meta,
        sentAt: new Date().toISOString(),
      };
      pushPreview(row);
      return { delivered: true, transport: 'preview' };
    }
    case 'log':
    default: {
      console.log(`[email:log] ${payload.kind} → ${payload.to}\n  ${payload.subject}\n  ${payload.text}\n`);
      return { delivered: true, transport: 'log' };
    }
  }
};

/** Resolve the locale to render in for a user. */
export const userLocale = (user: { locale?: string | null } | null | undefined): Locale =>
  user?.locale === 'en' ? 'en' : 'el';
