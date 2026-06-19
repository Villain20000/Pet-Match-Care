# Pet-Match & Care — Backend

Express + TypeScript + Prisma + PostgreSQL.

## Quickstart

```bash
cd backend
cp .env.example .env       # fill DATABASE_URL and JWT_SECRET (min 16 chars)
npm install
npm run prisma:generate
npm run prisma:migrate    # creates tables on first run
npm run dev               # http://localhost:4000
```

> 💡 Push notifications work in **dry-run mode** unless you supply a
> Firebase service account (JSON file or inline JSON string) in the env.

## High-level architecture

```
src/
  config/      env + Prisma singleton
  utils/       password hashing, JWT, HTTP helpers
  middlewares/ auth, error handler
  services/    geo, FCM, municipality lookup
  controllers/ auth, reports, alerts, spots, adoption
  routes/      express routers, one per resource
```

## API

Error responses are **bilingual envelopes** — see "🌍 Internationalization" in the root README for the full `{ error: { code, messages: { el, en }, serverMessage } }` shape. Server-rendered emails already pick the user's stored locale.
JWT is sent as `Authorization: Bearer <token>`.

| Method | Path                              | Auth | Notes                                          |
| ------ | --------------------------------- | ---- | ---------------------------------------------- |
| POST   | `/api/auth/register`              | —    | Returns `{ token, user }`                      |
| POST   | `/api/auth/login`                 | —    | Returns `{ token, user }`                      |
| GET    | `/api/auth/me`                    | ✅   | Current user profile                           |
| PUT    | `/api/auth/push-token`            | ✅   | Register FCM token for poison alerts           |
| POST   | `/api/reports`                    | ✅   | Auto-assigns closest Greek municipality        |
| GET    | `/api/reports/nearby?lat&lng&radius` | ✅ | Open / in-progress reports within `radius` km |
| PATCH  | `/api/reports/:id/status`         | ✅   | Workers / shelter admins only                  |
| POST   | `/api/alerts/poison`              | ✅   | 2 km geofence + FCM fan-out                    |
| GET    | `/api/alerts/poison/active`       | ✅   | Non-expired alerts near the client             |
| POST   | `/api/alerts/poison/:id/test-push` | ✅  | Re-send alert to current user                  |
| GET    | `/api/spots`                      | opt  | Pet-friendly cafés / parks / vets / apartments |
| POST   | `/api/spots`                      | ✅   | Creates a new spot (+1 from creator)           |
| POST   | `/api/spots/:id/vote`             | ✅   | `value: 1` or `-1`, auto-verifies at ≥3        |
| POST   | `/api/spots/:id/flag`             | ✅   | Mark spot as inaccurate                        |
| GET    | `/api/adoption`                   | opt  | Search + filter                                |
| POST   | `/api/adoption/:id/interest`      | ✅   | "Εκδήλωση Ενδιαφέροντος"                       |
| GET    | `/api/municipalities`              | —    | Closest-municipality seed list                 |

See `src/controllers/alerts.controller.ts` for the geofencing + push flow.
