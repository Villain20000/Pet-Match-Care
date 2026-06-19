# 📧 Email Pipeline

Three transports behind one interface. Each is selectable at boot via
the `MAIL_TRANSPORT` env var.

| Transport | What it does | When |
|-----------|--------------|------|
| `smtp`    | Real outbound through `SMTP_HOST` (Mailtrap in dev, SES etc in prod). | Production + dev with real creds. |
| `preview` | In-memory inbox exposed at `GET /api/_dev/email-preview`. Triple-guarded by `NODE_ENV`, `DEV_EMAIL_PREVIEW_TOKEN`, and an `X-Dev-Token` header. | Dev only. |
| `log`     | `console.log` the rendered templates. Default when nothing is set. | Quick smoke testing. |

## Setting up Mailtrap for dev

1. Sign up at <https://mailtrap.io> (free tier).
2. Create an inbox → Sandbox → "Show Credentials".
3. Copy `Host`, `Port`, `User`, `Pass` into your `.env`:

   ```ini
   MAIL_TRANSPORT=smtp
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=…your-username…
   SMTP_PASSWORD=…your-password…
   ```

4. Hit `POST /api/auth/register` (or `POST /api/auth/forgot`) for an existing user.
5. Open your Mailtrap inbox. You'll see the rendered verify / reset email **with the deep-link** ready to click.

## Deep-link flow (what happens when the user taps the email)

The email CTA is `petmatchcare://verify-email?token=…` (and similar for reset).
On Android, the OS uses the `intentFilters` declared in `mobile/app.json`
to dispatch the URL into `MainActivity`, which surfaces it to React
Native's `Linking.getInitialURL()` (cold start) or
`Linking.addEventListener('url', …)` (app already open). The
`installLinkingListeners()` in `mobile/App.tsx` registers both.

The deep link is parsed by `mobile/src/services/deeplink.ts`. If the user
is logged in and not yet verified, the `VerifyEmailScreen` mounts with
the token as a route param and consumes it via `useAuthStore.verifyEmail`.
If the user isn't logged in, the token is parked until they sign in.

A second compliant path: clicking the link from a desktop browser lands
on `https://app.petmatchcare.gr/verify-email?token=…`. The backend
returns a 302 redirect to `petmatchcare://verify-email?token=…`, which
the OS then dispatches.

## Production assertion

`NODE_ENV=production` + non-`smtp` transport is fatal. The
`sendEmail` function returns
`{ delivered: false, transport, reason: 'BLOCKED_PROD_NON_SMTP' }`
and logs an error. So even if the env var is misconfigured, real users
won't silently lose magic-link emails.

## HTML escaping

Every user-derived string flows through `escapeHtml(...)` before being
stamped into the template. The template is a fixed layout; only escaped
strings enter it. Tests cover:

* A pet name of `<script>alert(1)</script>` is encoded to
  `&lt;script&gt;alert(1)&lt;/script&gt;` in the HTML body.

## Deep-link design

We **always** include both paths:

* `mobileUrl` — `petmatchcare://…` (preferred).
* `webUrl` — `https://app.petmatchcare.gr/…` (fallback for clients that
  don't understand the scheme).

Most modern mail clients prefer tapping the button, which uses the
mobile deep-link. Outlook + some older clients will instead show the
raw URL.

## Inspecting preview emails in dev

```bash
MAIL_TRANSPORT=preview DEV_EMAIL_PREVIEW_TOKEN=dev-secret npm run dev

# Trigger a forgot-password for user@host
curl -X POST localhost:4000/api/auth/forgot \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@host"}'

# Pull the last 10 preview emails
curl -s 'localhost:4000/api/_dev/email-preview?limit=10' \
  -H 'X-Dev-Token: dev-secret' | jq

# Clear the inbox
curl -X POST localhost:4000/api/_dev/email-preview/clear \
  -H 'X-Dev-Token: dev-secret'
```

The response includes `meta.token`, `meta.mobileUrl`, and `meta.webUrl`
so a CLI test can directly consume the token via `/api/auth/verify-email`.

## Templates

Three built-in templates render against a shared `renderBaseEmail()`
shell:

| Template key  | Trigger |
|---------------|---------|
| `verifyEmail` | Registration, "resend verification" |
| `passwordReset` | `POST /api/auth/forgot` |
| `adoptionStatus` | Application state transitions |

Each is parametrized with `escapeHtml()`-d inputs and a "did you
request this?" disclaimer where appropriate.

## Persistence guarantees

In `preview` mode, the inbox is module-scoped. Multiple processes won't
share, but a single Node process retains the last 50 with LRU eviction.
`POST /api/_dev/email-preview/clear` empties it.
