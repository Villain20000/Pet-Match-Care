# Pet-Match & Care — v2 Architecture

High-level overview of the production-grade pets-in-Greece platform
post-v2 rebuild. Read this before adding new features.

## Layers

```
backend/   (Express + TypeScript + Prisma + PostgreSQL)
  prisma/schema.prisma       single source of truth for the DB
  src/services/              business logic — pure functions, no HTTP
  src/controllers/           HTTP shape; thin layer over services
  src/middlewares/           auth, error, rate-limit
  src/routes/                Express routers, one per resource

mobile/    (React Native + Expo + NativeWind)
  src/services/              API clients + react-query hooks
  src/components/            visual building blocks
  src/screens/               top-level routes
  src/navigation/            stack + tab composition
  src/theme/                 design tokens (incl. color-blind + hi-contrast)
```

## Identity (auth v2)

The single most important change in v2 is replacing the long-lived JWT
with **access + refresh tokens with family-based reuse detection**.

* `POST /api/auth/login` → `{ accessToken, refreshToken, user, requires2fa }`
* All writes install `Authorization: Bearer <accessToken>`.
* On 401, the mobile interceptor calls `POST /api/auth/refresh` **once**;
  concurrent 401s queue behind the same `inflightRefresh` promise.
* If the backend sees a refresh token whose `replacedById != null`, it
  revokes the entire `familyId`. This is automatic replay-attack
  detection — the user is signed out everywhere.

### 2FA (TOTP) step-up

`POST /api/auth/step-up { code }` returns a fresh access token with the
claim `stepUpExpiresAt = now + 5m`. Any sensitive endpoint that calls
`requireStepUp('adoption:apply')` checks this claim. Citizens must
authenticate through 2FA in the last 5 minutes to submit an adoption
application.

### SSO (Google first, Apple next)

`GET /api/auth/oauth/google/start` returns the auth URL.
`GET /api/auth/oauth/google/callback` validates the code against
Google's userinfo endpoint, auto-links the existing user **only when
`email_verified` is true**, otherwise creates a new user. The backend
mints the same AT + RT pair as a password login.

### Sessions list

A `UserSession` row is upserted on every successful refresh. Users can
inspect + revoke them via `GET /api/auth/sessions` and the
`logout-everywhere` endpoint.

## Adoption application state machine

```
DRAFT
  ↓ SUBMITTED                  (CITIZEN)
SUBMITTED
  ↓ SCREENING                  (SHELTER_ADMIN)
SCREENING
  ↓ HOME_CHECK_SCHEDULED       (SHELTER_ADMIN)
HOME_CHECK_SCHEDULED
  ↓ APPROVED | REJECTED        (SHELTER_ADMIN)
APPROVED
  ↓ ADOPTION_COMPLETED         (SHELTER_ADMIN)
```

Concurrent transitions are guarded by **optimistic locking** via
`updatedAt` — the client sends its last-known timestamp; if the server's
record has moved on, we return 409 `STALE_STATE`.

Every transition writes an `ApplicationAudit` row and triggers an
in-app notification + (sometimes) FCM.

## Stray report timeline

`StrayReportUpdate` is an append-only audit trail. Municipal workers
post updates; the reporter gets a notification each time. The mobile
`TimelineScreen` renders it as a vertical timeline with status-coloured
markers.

## Lost-pet matching

When a StrayReport has `condition = LOST` or its description contains
"χαμέν", we run `findMatches(...)` against the registry and auto-push
FCM to the owners. Each match has a score:
* `+1` if within 3 km
* `+2` if description contains the lost pet's name
* `+1` if description contains the breed

## Gamification

* **Badges** — predicate engine in `services/badges.engine.ts`. New
  badges can be added by inserting a `Badge` row with a JSON predicate.
  `evaluateBadges(userId)` is idempotent and is called after every
  state-changing action.
* **Streaks** — `dailyStreak` table is unique per `(userId, date)` so
  multiple check-ins on the same UTC day are no-ops.
* **In-app notifications** — `Notification` rows are created in the
  service layer immediately after the state change; the mobile inbox
  re-fetches every minute.

## Mobile polish (sparkle pass)

* **react-query offline cache** — every successful query response is
  written to AsyncStorage. List screens that lose connectivity still
  show the last-known state.
* **Skeleton placeholders** — SkeletonLine / SkeletonCard / SkeletonCircle
  render before data arrives.
* **Animated karma counter** — interpolate from 0→karma over 900ms.
* **Stepper** for multi-step forms.
* **Haptics via expo-haptics** on every critical interaction.
* **A11y** — Dynamic Type scale clamps to 0.9–1.6×, high-contrast theme,
  three color-blind presets, every Tap/Press has TalkBack labels.

## Cross-cutting ops

* `npm run dev` (backend) + `npm run android` (mobile) + a real
  `DATABASE_URL` are all you need to get going.
* Push notifications work in dry-run mode unless `FIREBASE_SERVICE_ACCOUNT_*`
  env vars are set.
* Google SSO works once `GOOGLE_CLIENT_ID/SECRET` are set + a real
  `OAUTH_REDIRECT_BASE`.
* The mobile app never speaks to a specific user directly — every
  entity identification is server-issued.
