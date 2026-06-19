#!/usr/bin/env tsx
/**
 * Standalone CLI test for the email service. Runs without an SMTP
 * connection so devs can verify the rendered templates and the deep
 * link shape end-to-end.
 *
 * Usage:
 *   npm run test:email -- --to you@example.com
 *
 * Inspect output:
 *   - The HTML template renders with the recipient name and a fully
 *     formed deep link to `petmatchcare://verify-email?token=…`.
 *   - With MAIL_TRANSPORT=preview, hits GET /api/_dev/email-preview
 *     afterwards to inspect via API.
 */
import { sendEmail, templates } from '@/services/email.service';

const to = process.argv.find((a) => a.startsWith('--to='))?.split('=')[1] ?? 'dev@example.com';

(async () => {
  console.log(`[test-email] MAIL_TRANSPORT=${process.env.MAIL_TRANSPORT ?? 'unset (will fail)'}`);

  const reset = templates.passwordReset('demo-reset-token');
  const verify = templates.verifyEmail('demo-verify-token');

  console.log('\n--- password reset deep link ---');
  console.log((reset.meta as any)?.mobileUrl);
  console.log('--- verify email deep link ---');
  console.log((verify.meta as any)?.mobileUrl);

  console.log('\n--- sending password reset email ---');
  console.log(await sendEmail({
    to,
    subject: reset.subject,
    text: reset.text,
    html: reset.html,
    kind: reset.kind,
    meta: reset.meta,
  }));

  console.log('\n--- sending verify email ---');
  console.log(await sendEmail({
    to,
    subject: verify.subject,
    text: verify.text,
    html: verify.html,
    kind: verify.kind,
    meta: verify.meta,
  }));
})().catch((err) => {
  console.error('[test-email] failure:', err);
  process.exit(1);
});
