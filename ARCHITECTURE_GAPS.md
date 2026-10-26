# PET-MATCH & CARE — ARCHITECTURE GAPS & DESIGN SPECIFICATION

**Date:** March 2025
**Version:** 1.0.0
**Target Architecture:** Modular Monolith (Express + Prisma + PostgreSQL/PostGIS + React Native/Expo)

---

## 1. ARCHITECTURAL OVERVIEW & DOMAIN BOUNDARIES

The current architecture follows a clean Express/Prisma structure, but lacks distinct domain encapsulation. Domain models are directly coupled in central controllers, and geographic calculations are performed in Node.js memory rather than within PostgreSQL/PostGIS.

```
                      +-----------------------------------+
                      |   React Native / Expo Mobile App  |
                      +-----------------+-----------------+
                                        |
                                HTTP / REST (JSON)
                                        |
                      +-----------------v-----------------+
                      |    Express.js Modular Router      |
                      +-----------------+-----------------+
                                        |
        +-------------------------------+-------------------------------+
        |                               |                               |
+-------v-------+               +-------v-------+               +-------v-------+
|  Auth & User  |               |  Stray/Alert  |               |   Adoption    |
|    Domain     |               |  Geo-Domain   |               |   Domain      |
+-------+-------+               +-------+-------+               +-------+-------+
        |                               |                               |
        +-------------------------------+-------------------------------+
                                        |
                      +-----------------v-----------------+
                      |    Prisma ORM / Data Layer        |
                      +-----------------+-----------------+
                                        |
                      +-----------------v-----------------+
                      | PostgreSQL 14+ / PostGIS Extension|
                      +-----------------------------------+
```

---

## 2. KEY ARCHITECTURAL GAPS

### Gap 1: In-Memory Haversine vs. Native PostGIS Spatial Queries
- **Current Pattern:** Geofencing and nearest-municipality routing perform raw SQL `Float` math or compute Haversine distances in Node.js loops (`geo.service.ts`).
- **Target Design:** Migrate `latitude` / `longitude` fields to native PostGIS `geography(Point, 4326)` columns with spatial GIST indexes. Utilize `ST_DWithin` for geofencing and `ST_Distance` / `ST_Contains` for municipal boundary queries.

### Gap 2: Single-Tenant Role Coupling vs. Multi-Organization RBAC
- **Current Pattern:** Roles (`CITIZEN`, `VOLUNTEER`, `MUNICIPAL_WORKER`, `SHELTER_ADMIN`, `PLATFORM_ADMIN`) are assigned statically to individual `User` records. A shelter admin cannot manage multiple shelters, nor can a user be a volunteer for multiple NGOs.
- **Target Design:** Introduce an `Organization` model (`SHELTER`, `MUNICIPALITY`, `VET_CLINIC`, `NGO`) with an `OrganizationMember` junction table carrying localized roles (`OWNER`, `MANAGER`, `WORKER`, `VOLUNTEER`).

### Gap 3: Synchronous FCM & Email Delivery vs. Asynchronous Job Queue
- **Current Pattern:** Push notifications and transactional emails are sent synchronously within HTTP request cycles (`fcm.service.ts`, `email.service.ts`). Network latency or third-party API downtime directly impacts client response times.
- **Target Design:** Implement a Redis-backed job queue (BullMQ / Bee-Queue) or lightweight PostgreSQL-backed task queue (`pg-boss` / Prisma job queue) for background execution of emails, push notifications, and badge predicate evaluations.

### Gap 4: Direct Coordinate Public Exposure vs. Differential Privacy
- **Current Pattern:** Stray report locations and poison alert coordinates return precise GPS numbers (`latitude`, `longitude`) to all connected client users.
- **Target Design:** Implement coordinate fuzzing (adding random offset within 200m) for public citizen feeds, releasing exact coordinates only to assigned municipal workers or verified rescue volunteers.

### Gap 5: Absence of Offline Mobile Synchronization
- **Current Pattern:** Mobile client actions require an active network connection. Offline actions fail immediately with network error toasts.
- **Target Design:** Add `@react-native-async-storage/async-storage` offline mutation queue with optimistic local state updates and automatic background synchronization upon network reconnection.

---

## 3. DOMAIN-DRIVEN MODULAR MONOLITH REFACTORING PLAN

1. **`src/modules/auth/`**: Token lifecycle, 2FA/TOTP, OAuth, Session management.
2. **`src/modules/identity/`**: Profiles, privacy presets, user blocks, content moderation.
3. **`src/modules/stray/`**: Stray reporting, municipal auto-routing, SLA management, rescue dispatch.
4. **`src/modules/alerts/`**: Emergency poison alerts, PostGIS geofencing, FCM push alerts.
5. **`src/modules/adoption/`**: Pet listings, application state machine, home check audits, virtual sponsorship.
6. **`src/modules/foster/`**: Foster registration, availability calendar, matching, placement tracking.
7. **`src/modules/health/`**: Pet medical records, vaccination schedules, vet signatures, appointment booking.
8. **`src/modules/community/`**: Forum posts, comments, pet-friendly spots, crowd voting, messaging.
9. **`src/modules/gamification/`**: Streaks, karma calculations, badge engine, partner reward market.
10. **`src/modules/organization/`**: Multi-tenant organizations, memberships, role permissions, analytics.
