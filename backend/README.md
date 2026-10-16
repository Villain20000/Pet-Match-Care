# Pet-Match & Care — Backend API

Express + TypeScript + Prisma + PostgreSQL REST API for the Pet-Match & Care platform.

---

## 🚀 Quickstart

```bash
cd backend

# 1. Environment configuration
cp .env.example .env
# Set DATABASE_URL and JWT_SECRET (min 16 chars)

# 2. Install dependencies
npm install

# 3. Generate Prisma client & apply migrations
npm run prisma:generate
npm run prisma:migrate

# 4. Seed demo data (optional but recommended)
npm run prisma:seed

# 5. Start dev server with hot reload
npm run dev
# Server listening on http://localhost:4000
```

> 💡 **Push Notifications**: Firebase Cloud Messaging (FCM) runs in dry-run mode by default when credentials are not supplied, logging push payloads without raising errors.

---

## 👥 Seeded Demo Accounts

All accounts use the shared demo password: **`Demo12345!`**

| Email | Role | Name | Capabilities |
| --- | --- | --- | --- |
| `admin@petmatch.demo` | `PLATFORM_ADMIN` | Ιωάννης Διακυνητής | Platform admin, 2FA step-up, user roles |
| `shelter@petmatch.demo` | `SHELTER_ADMIN` | Αγγελία Φιλοζωικής | Shelter management, adoption approvals, pet records |
| `worker@petmatch.demo` | `MUNICIPALITY_WORKER` | Ελένη Μητρότητας | Stray report assignment, status transitions |
| `volunteer@petmatch.demo` | `VOLUNTEER` | Κωνσταντίνος Βοηθός | Foster care profile, feeding stations, field reports |
| `giannis@petmatch.demo` | `CITIZEN` | Γιάννης Πετροπούλας | Citizen reports, earned badges, community activity |
| `sophia@petmatch.demo` | `CITIZEN` | Σοφία Παπαδοπούλου | Adoption applicant, submitted application, favorites |

---

## 🔌 API Routes Reference

All endpoints return JSON. Authenticated endpoints require header: `Authorization: Bearer <token>`.
Bilingual error envelope: `{ success: false, error: { code, messages: { el, en }, serverMessage } }`.

### Authentication & Account (`/api/auth`)
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | — | Register local citizen account |
| POST | `/api/auth/login` | — | Login with email & password |
| POST | `/api/auth/refresh` | — | Exchange refresh token for new access token |
| POST | `/api/auth/logout` | ✅ | Revoke current session |
| GET | `/api/auth/me` | ✅ | Current user profile |
| PUT | `/api/auth/profile` | ✅ | Update profile (locale, home coordinates) |
| PUT | `/api/auth/push-token` | ✅ | Register FCM device token |
| POST | `/api/auth/2fa/start` | ✅ | Start TOTP 2FA enrollment (returns secret + QR) |
| POST | `/api/auth/2fa/verify` | ✅ | Confirm TOTP code & enable 2FA |
| POST | `/api/auth/2fa/step-up` | ✅ | Elevate session for sensitive operations |
| POST | `/api/auth/sso/google` | — | Google OAuth token exchange |
| POST | `/api/auth/forgot-password` | — | Trigger password reset email |
| POST | `/api/auth/reset-password` | — | Complete password reset with token |

### Stray Reports (`/api/reports`)
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/reports` | ✅ | Create report (auto-routes to closest municipality) |
| GET | `/api/reports/nearby` | ✅ | Query reports by lat, lng & radius |
| GET | `/api/reports/:id` | ✅ | Get stray report details |
| PATCH | `/api/reports/:id/status` | ✅ | Update report status (`ASSIGNED`, `RESOLVED`, etc.) |

### Poison Alerts (`/api/alerts/poison`)
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/alerts/poison` | ✅ | Publish poison alert (triggers 2 km FCM fan-out) |
| GET | `/api/alerts/poison/active` | ✅ | Query active alerts within geofence |
| POST | `/api/alerts/poison/:id/test-push` | ✅ | Send test push notification for alert |

### Pet-Friendly Spaces (`/api/spots`)
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/spots` | opt | List spots (cafés, parks, vets, housing) |
| POST | `/api/spots` | ✅ | Create a new community spot |
| POST | `/api/spots/:id/vote` | ✅ | Upvote/downvote (+1 / -1; verified at ≥ 3) |
| POST | `/api/spots/:id/flag` | ✅ | Flag inaccurate or closed spot |

### Adoption Catalog & Applications (`/api/adoption`, `/api/adoption-applications`)
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/adoption` | opt | Filter adoptable shelter pets |
| GET | `/api/adoption/:id` | opt | Pet details with medical record summary |
| POST | `/api/adoption/:id/interest` | ✅ | Quick-tap interest notification |
| GET | `/api/adoption-applications` | ✅ | List user's or shelter's applications |
| POST | `/api/adoption-applications` | ✅ | Submit formal adoption application |
| GET | `/api/adoption-applications/:id` | ✅ | Application details with audit trail |
| PATCH | `/api/adoption-applications/:id/status` | ✅ | State transition (under review, approved, etc.) |
| POST | `/api/adoption-applications/:id/home-check` | ✅ | Schedule home environment inspection |

### Gamification & Community
| Prefix | Path | Description |
| --- | --- | --- |
| `/api/badges` | `GET /`, `GET /my` | List badges & user-earned achievements |
| `/api/streaks` | `GET /my`, `POST /check-in` | Daily activity streaks and karma bonuses |
| `/api/ugc` | `/posts`, `/comments` | Forum feed, discussions, rescue stories |
| `/api/lost-pets` | `/lost-pets`, `/lost-pets/match` | Lost & found pet registry and radar |
| `/api/favorites` | `/favorites`, `/favorites/toggle` | Saved adoptable pets |
| `/api/timeline` | `/timeline/:petId` | Pet veterinary history & care events |
| `/api/notifications` | `/notifications` | In-app notification inbox |
| `/api/platform-features` | `/feeding-stations`, `/campaigns`, `/challenges`, `/rewards`, `/tags`, `/events`, `/sitters` | Community welfare platform services |

---

## 🧪 Testing & Quality Gates

```bash
npm run typecheck         # TypeScript compilation check
npm run lint              # ESLint analysis
npm run build             # Prisma generation & production build
npm run prisma:seed       # Seed execution test
npm run test:i18n         # 22-case bilingual error-envelope E2E suite
npm run test:catalog      # Backend + mobile catalog parity check
npm run test:email        # Mailer template rendering & escaping test
```
