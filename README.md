# 🐾 Pet-Match & Care

**Διαχείριση Αδέσποτων & Pet-Friendly Χώρων** — a full-stack, bilingual (Greek-first 🇬🇷, English mirror 🇬🇧) platform that connects municipalities, animal-welfare organizations (φιλοζωικές), volunteers, and citizens to rescue, care for, and rehome stray animals across Greece.

```
Pet-Match-Care/
├── backend/   Express + TypeScript + Prisma + PostgreSQL
├── mobile/    React Native + Expo + NativeWind (Android & iOS + Web)
└── docs/      Architecture, i18n, and email technical specifications
```

---

## ✨ Features

- **Live Stray Reporting** — Citizens submit reports with photos and GPS coordinates. The backend auto-routes each report to the closest Greek municipality and awards karma points.
- **Poison Alerts (Φόλες) & Geofencing** — Emergency hazard alerts broadcast via high-priority Android/iOS push notifications (FCM) to all users living within a 2 km geofence.
- **Full Adoption Market & Application Workflow** — Browse adoptable pets with full veterinary history. Includes a multi-step adoption application state machine (`SUBMITTED` → `UNDER_REVIEW` → `HOME_CHECK_SCHEDULED` → `APPROVED` / `REJECTED` / `WITHDRAWN`), applicant questionnaire, and home-check inspection audits.
- **Interactive Pet-Friendly Map** — Cafés, parks, vets, and pet-welcome apartments curated by the community with crowd-voting and automatic verification (≥ 3 👍).
- **Pet Health & Medical Timeline** — Digital health records, vaccination schedules, vet visit tracking, and scheduled care reminders.
- **Lost & Found Pet Radar** — Report missing or found pets with breed/color filters, photo matching, and configurable proximity alerts.
- **Gamification Engine** — Activity streaks, automated badge awards (First Report, Stray Hero, Super Foster, Shelter Champion), karma points, and community challenge leaderboards with claimable rewards.
- **Community Forum & UGC** — Citizen rescue stories, adoption updates, advice threads, comments, and post reactions.
- **Care Network & Platform Services** — Municipal feeding station tracking, shelter donation campaigns, vetted pet sitters, pet-friendly community events, and digital NFC/QR pet tags.
- **Robust Identity & Security** — Dual-token JWT auth with refresh rotation, biometric unlock, two-factor authentication (TOTP authenticator app) for administrative actions, Google OAuth SSO, and password reset workflows.
- **Accessibility & Inclusive Design** — Built-in color-blind presets (Deuteranopia, Protanopia, Tritanopia), high-contrast accessibility mode, and dark/light system theme support.
- **🔔 Toasts & Haptic Feedback** — Bottom-snackbar system with bilingual error resolution, per-variant haptics (`expo-haptics`), max-3 auto-stack, and automatic surfacing of 5xx/network errors via Axios interceptors.
- **🌍 100% Bilingual Stack** — Greek source of truth (`el`) with complete English mirror (`en`). Mobile `useT()` hook and backend `wireError()` middleware resolve language dynamically with zero runtime drift.

---

## 👥 Demo Accounts (Seeded)

All demo accounts are pre-verified and ready for immediate login with password: **`Demo12345!`**

| Email | Role | Name | Intended Testing Purpose |
| --- | --- | --- | --- |
| `admin@petmatch.demo` | `PLATFORM_ADMIN` | Ιωάννης Διακυνητής | Platform management, 2FA step-up, user roles |
| `shelter@petmatch.demo` | `SHELTER_ADMIN` | Αγγελία Φιλοζωικής | Shelter management, pet listings, adoption approvals |
| `worker@petmatch.demo` | `MUNICIPALITY_WORKER` | Ελένη Μητρότητας | Stray report assignment, municipality triage |
| `volunteer@petmatch.demo` | `VOLUNTEER` | Κωνσταντίνος Βοηθός | Foster care profile, field reporting, feeding stations |
| `giannis@petmatch.demo` | `CITIZEN` | Γιάννης Πετροπούλας | Citizen reporter, stray reports, earned badges |
| `sophia@petmatch.demo` | `CITIZEN` | Σοφία Παπαδοπούλου | Adoption applicant, favorites, community forum |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.x
- **PostgreSQL** ≥ 14 (with `postgis` support)
- **npm** ≥ 9.x
- **Expo CLI** (`npm i -g expo`)

### 1. Backend Setup

```bash
cd backend

# Configure environment variables
cp .env.example .env
# Edit .env to set your DATABASE_URL, JWT_SECRET, and optional email/FCM credentials

# Install dependencies
npm install

# Run database migrations and seed demo data
npm run prisma:migrate
npm run prisma:seed

# Start the development server (http://localhost:4000)
npm run dev
```

> 💡 **Push Notifications**: FCM operates safely in **dry-run mode** when credentials are not configured, logging payloads without failing. Supply `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON` for live push deliveries.

### 2. Mobile Client Setup

```bash
cd mobile

# Install dependencies
npm install
```

Choose your target environment:

| Target | Command | Notes |
| --- | --- | --- |
| **Web Browser** | `npm run web` | Fastest preview; runs in Chrome/Firefox at `http://localhost:8081` |
| **Android Emulator** | `npm run android` | Full native shell via Android Studio |
| **iOS Simulator** | `npm run ios` | macOS with Xcode required |
| **Physical Device** | `npm run start` | Scan the QR code using the **Expo Go** app |

The default API base URL is `http://10.0.2.2:4000/api` for the Android emulator and `http://localhost:4000/api` for Web. Customize this in `mobile/app.json → extra.apiBaseUrl`.

---

## 🧪 Testing & Verification

Both workspaces include comprehensive test suites and quality gates:

### Backend Checks

```bash
cd backend

npm run typecheck         # TypeScript compile check (tsc --noEmit)
npm run lint              # ESLint rules enforcement
npm run build             # Prisma client generation & compilation
npm run prisma:seed       # Database seed validation
npm run test:i18n         # 22-case bilingual error-envelope E2E suite
npm run test:catalog      # Bi-directional catalog parity audit (backend + mobile)
npm run test:email        # Email template rendering & escaping test
```

### Mobile Checks

```bash
cd mobile

npm run typecheck         # Full TypeScript check (tsc --noEmit)
npm run lint              # ESLint rules check (--max-warnings 0)
npm run test:toast:visual # Toast styling, contrast tokens, and color-blind shifts test
npm run web               # Metro bundler export / web preview
```

### Git Pre-Commit Hook

A pre-commit hook is installed automatically to enforce catalog parity and prevent localization regressions:

```bash
cd backend && npm run setup:hooks
```

---

## 🌍 Internationalization Architecture

Every string across the platform is maintained in parity across Greek (`el`) and English (`en`):

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

- **Client**: `const t = useT()` resolves the user's active locale instantly, falling back gracefully to Greek.
- **Server**: Errors use semantic codes thrown via `HttpError(status, CODE)` and are transformed by `wireError` into bilingual envelopes based on user profile and `Accept-Language` headers.
- **Parity Guard**: `npm run test:catalog` runs in CI and pre-commit to guarantee that every single key and interpolation placeholder matches between Greek and English.

---

## 🎨 Design System

| Token | Hex | Role | Usage |
| --- | --- | --- | --- |
| `terracotta` | `#E07A5F` | Primary Brand | Primary buttons, active tabs, rescue alerts |
| `sage` | `#81B29A` | Secondary / Success | Pet-friendly spots, verified items, positive toasts |
| `crimson` | `#E63946` | Urgent Alert | Poison alerts (Φόλες), injury reports, error states |
| `cream` | `#F4F1DE` | Neutral Light | Surface backgrounds, card containers |
| `charcoal` | `#2F3E46` | Text / Dark Surface | Primary headers, high-contrast text |

- **Tokens**: Material-3 inspired surfaces (`rounded-3xl`), accessibility contrast ratios (WCAG AA compliant), and haptic confirmations on tap.
- **Color-Blind Presets**: Active color transforms for Deuteranopia, Protanopia, and Tritanopia in `mobile/src/theme/`.

---

## 🧭 Repository Structure

```
Pet-Match-Care/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            # Database models & relationships
│   │   ├── seed.ts                  # Self-contained demo data seeder
│   │   └── tsconfig.json            # Prisma TypeScript configuration
│   ├── src/
│   │   ├── config/                  # Environment variables & Prisma client
│   │   ├── controllers/             # Express route controllers
│   │   ├── middlewares/             # Auth, role guards, bilingual error handler
│   │   ├── routes/                  # Modular resource routers
│   │   ├── services/                # Business logic (geo, badges, FCM, email)
│   │   └── app.ts                   # Express application setup
│   └── scripts/                     # Catalog parity and email test scripts
├── mobile/
│   ├── src/
│   │   ├── components/              # Shared UI components (ToastHost, sheets, buttons)
│   │   ├── locales/                 # el.ts (source) & en.ts (mirror) catalogs
│   │   ├── navigation/              # Bottom tabs & stack navigators
│   │   ├── screens/                 # Mobile views (Map, Reports, Adoption, Forum, Profile)
│   │   ├── services/                # Axios API client, auth store, toast queue, a11y
│   │   └── theme/                   # Colors, tokens, contrast modes, color-blind presets
│   └── scripts/                     # Toast visual testing and metro bundler patchers
└── docs/
    ├── ARCHITECTURE.md              # Auth tokens, 2FA, adoption state machine
    ├── I18N.md                      # Internationalization architecture & conventions
    └── EMAIL.md                     # Email delivery, templates, and deep linking
```

---

## 📄 License

Private repository — all rights reserved.
