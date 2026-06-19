# 🐾 Pet-Match & Care

**Διαχείριση Αδέσποτων & Pet-Friendly Χώρων** — a full-stack, bilingual
(Greek-first 🇬🇷, English mirror 🇬🇧) platform that connects municipalities,
animal-welfare organizations (φιλοζωικές), and citizens to save and rehome
stray animals across Greece.

```
Pet-Match-Care/
├── backend/   Express + TypeScript + Prisma + PostgreSQL
└── mobile/    React Native + Expo + NativeWind (Android-first)
```

---

## ✨ What it does

- **Live stray reporting** — a citizen submits a photo + GPS, the backend
  auto-routes it to the nearest Greek municipality and grants karma.
- **Poison alerts (Φόλες)** with a 2 km geofence — high-priority Android
  push notifications hit everyone whose home is within range.
- **Pet-friendly map** — cafés, parks, vets and pet-welcome apartments,
  curated via community voting (auto-verifies after 3 👍).
- **Adoption market** — search & filter adoptable pets, modal with full
  vet records, and a single-tap interest button.
- **Karma** gamification to reward civic participation.
- **🌍 Bilingual UI + emails** — Greek-first catalog, English mirror;
  a single `useT()` hook in the mobile app and a `wireError()` helper
  on the backend resolve the active locale on every render and every
  HTTP response. Flip a switch in Settings, the whole stack flips.

---

## 🚀 Getting started

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 14 with the `postgis` extension available
- Expo CLI (`npm i -g expo`)
- Android Studio + an emulator (or a physical Android device)

### Backend

```bash
cd backend
cp .env.example .env       # fill DATABASE_URL + JWT_SECRET + (optional) MAIL_TRANSPORT
npm install
npm run prisma:migrate     # first migration creates all tables
npm run prisma:seed        # optional: load demo users, reports, pets
npm run dev                # http://localhost:4000
```

> 🔔 Push notifications work in **dry-run mode** until you wire up a
> Firebase service account. Drop the JSON path (or full JSON string) into
> the appropriate env vars and you're set.

### Mobile

```bash
cd mobile
npm install
```

Then **pick a target**:

| Goal | Command |
| --- | --- |
| Android emulator (full native shell) | `npm run android` |
| iPhone simulator (macOS only) | `npm run ios` |
| Physical device | `npm run start` and scan the QR with **Expo Go** (Play Store) |
| **No emulator** — fastest preview in Chrome | `npm run web` |

The default backend URL baked into the app is `http://10.0.2.2:4000/api`
(so the Android emulator can reach the host's Express server). Override
the URL via `mobile/app.json → extra.apiBaseUrl`.

> ⚠️ **Known install blocker**: `expo-local-authentication@~15.0.4` is no
> longer in the npm registry. Bump it to `~16.0.x` in
> `mobile/package.json` before running `npm install`, or drop the
> dependency if biometric unlock isn't critical to your preview.

---

### Quickstart — Email (Mailtrap)

```ini
cp backend/.env.example backend/.env
# Set MAIL_TRANSPORT=smtp + Mailtrap credentials (see docs/EMAIL.md).
```

Then `POST /api/auth/forgot` will deliver the password-reset HTML email
to your Mailtrap inbox. Tap the link from your phone to roundtrip
through the deep-link screen. See **[`docs/EMAIL.md`](./docs/EMAIL.md)**
for transports (`smtp` / `preview` / `log`), HTML escaping, and the
deep-link design.

---

## 🌍 Internationalization

Pet-Match & Care ships entirely in two languages today: **Greek** (default)
and **English** (mirror). Users flip a switch in Settings and the UI
updates live; future email deliveries follow the same preference.

| Layer | How |
| --- | --- |
| Mobile UI | `t('dashboard.greeting')` via `useT()` hook in `mobile/src/services/i18n.ts` |
| Backend errors | Code-only `HttpError(status, CODE)` thrown from controllers/services → `wireError(req, …)` middleware renders a bilingual envelope |
| Backend emails | `templates.verifyEmail({ token, locale })` reads the user-stored locale, falls back to `Accept-Language`, falls back to `el` |
| API surface | Mobile includes `Accept-Language: el\|en` on every Axios call — backend reads it before resolving a string |

**Envelope shape** (error responses):

```json
{
  "success": false,
  "error": {
    "code": "ILLEGAL_TRANSITION",
    "messages": {
      "el": "Μη επιτρεπτή μετάβαση: SUBMITTED → APPROVED",
      "en": "Illegal state transition: SUBMITTED → APPROVED"
    },
    "serverMessage": "ILLEGAL_TRANSITION: from=SUBMITTED to=APPROVED"
  }
}
```

The mobile Axios interceptor looks at `error.code` + the active locale
and surfaces the localizable message in the toast / sheet.

Full architecture, pitfalls and catalogue shape are in
**[`docs/I18N.md`](./docs/I18N.md)**.

---

## 🧪 Tests & CI

| Layer | Command | What it checks |
| --- | --- | --- |
| Backend catalog parity | `cd backend && npm run test:catalog` | Every Greek leaf has an English counterpart, leaf kinds agree, no `{{var}}` placeholder drift, no function-arity drift. Surface: **54 backend + 326 mobile leaves** each side. |
| Backend error envelope E2E | `cd backend && npx ts-node scripts/test-i18n.ts` | Boots a minimal Express app and asserts the bilingual error envelope flows correctly for 13 cases (locale header, user-locale override, fallback, validation path, per-kind 404, etc). |
| Email pipeline smoke | `cd backend && npm run test:email` | Renders each template against each locale + verifies HTML escaping. |
| Backend typecheck | `cd backend && npm run typecheck` | `tsc --noEmit`. |
| Mobile typecheck | `cd mobile && npm run typecheck` | `tsc --noEmit`. (Blocked by the Expo ETARGET pin noted above.) |

### Pre-commit hook

The repo ships a check that runs the catalog parity test before every
commit. One-shot install:

```bash
cd backend && npm run setup:hooks   # git config core.hooksPath → .githooks/
```

After this, every `git commit` runs `npm run test:catalog` and refuses
the commit on drift. The same script is registered as a `prepare`
lifecycle hook, so fresh clones pick it up automatically.

---

## 🔑 Design system

| Token | Hex | Use |
| --- | --- | --- |
| `terracotta` | `#E07A5F` | Primary, energy, rescue |
| `sage` | `#81B29A` | Pet-friendly spaces, balance |
| `crimson` | `#E63946` | Poison alerts & urgency |
| `cream` | `#F4F1DE` | Background, calm |
| `charcoal` | `#2F3E46` | Text, assertions |

Material-3 influences, `rounded-3xl` surfaces, smooth transitions, and
haptic feedback on every critical interaction (`expo-haptics`).

---

## 🧭 Repo map

- **`backend/`** — Express, Prisma, Zod, JWT auth.
  - `backend/prisma/schema.prisma` — full DB schema (User, StrayReport,
    PetForAdoption, PetFriendlySpot, PoisonAlert, Shelter, SpotVote).
  - `backend/src/middlewares/error.ts` — bilingual error envelope (`wireError`).
  - `backend/src/services/i18n.ts` — server-side catalog resolver.
  - `backend/scripts/test-catalog-parity.ts` — cross-workspace key audit.
  - `backend/src/controllers/alerts.controller.ts` — **2 km geofencing +
    FCM fan-out** for poison alerts.
- **`mobile/`** — React Native + Expo + NativeWind.
  - `mobile/src/services/i18n.ts` — `useT()` hook + Zustand locale store.
  - `mobile/src/locales/el.ts` (Greek source of truth), `en.ts` (mirror).
  - `mobile/src/screens/MapScreen.tsx` — full-screen map with floating
    category chips, pulsing poison markers, and a slide-up info sheet.
- **`docs/`** — deeper documentation.
  - **[`docs/I18N.md`](./docs/I18N.md)** — bilingual architecture, runtime, pitfalls.
  - **[`docs/EMAIL.md`](./docs/EMAIL.md)** — mail transports, deep links, HTML escaping.
  - **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)** — identity (access +
    refresh tokens + 2FA + SSO), adoption state machine, gamification.
