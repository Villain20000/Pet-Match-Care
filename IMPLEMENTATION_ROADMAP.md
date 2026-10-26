# PET-MATCH & CARE — IMPLEMENTATION ROADMAP & FEATURE BACKLOG

**Date:** March 2025
**Version:** 1.0.0
**Target Quality Gate:** Production Readiness for National Greek Rollout & Multi-Country Adaptation.

---

## EXECUTIVE SUMMARY & HIGHLIGHTS

### 🌟 Top 10 Most Urgent Issues & Quick Wins
1. **[P0] FIX-01: Object-Level Authorization (IDOR) on Application Audits** (Security Blocker)
2. **[P0] FIX-02: Public GPS Coordinate Fuzzing for Citizen Privacy** (Safety Blocker)
3. **[P0] FIX-03: Real OAuth Google/Apple Token Verification** (Auth Production Readiness)
4. **[P1] FEAT-01: Rescue Dispatch Console & Real-time Field Tracking** (High Welfare Impact)
5. **[P1] FEAT-02: Municipal SLA Management & Escalation Timers** (Government Utility)
6. **[P1] FEAT-03: Shelter Intake Capacity & Quarantine Isolation Management** (Shelter Operations)
7. **[P1] FEAT-04: Offline Rescue Reporting & SQLite Local Queue** (Field Usability Quick Win)
8. **[P2] FEAT-05: PostGIS Native Spatial Geofencing & ST_DWithin Indexing** (Performance)
9. **[P2] FEAT-06: Verified Vet Digital Signature & Prescription Management** (Pet Health Quality)
10. **[P2] FEAT-07: AI Breed Matching & Image Duplicate Detection** (Technical Innovation)

---

## CATEGORIZED IMPLEMENTATION BACKLOG

---

### PRIORITY P0: CRITICAL SECURITY & DATA INTEGRITY BLOCKERS

#### ISSUE P0-01: Fix IDOR Vulnerability on Application Audit Logs
1. **Title:** Fix Object-Level Authorization (IDOR) on Adoption Application Audit Logs
2. **Current Code Evidence:** `backend/src/controllers/adoption-applications.controller.ts` line 42 (`getAuditLogs`).
3. **Problem:** Any authenticated user can view application audit histories by UUID without verifying relationship to applicant or shelter.
4. **Desired Behavior:** Strict permission check ensuring only the applicant, authorized shelter admin, or platform admin can view logs.
5. **Affected Users:** Citizens, Shelter Admins.
6. **Frontend Work:** Handle 403 Forbidden gracefully with error toast.
7. **Backend Work:** Add `assertApplicationAccess` check in `adoption-applications.controller.ts`.
8. **Database Changes:** None.
9. **Security & Permissions:** Enforce RBAC ownership validation.
10. **Tests:** Unit test in `adoption-applications.test.ts` asserting 403 when accessing unauthorized audit logs.
11. **Dependencies:** None.
12. **Estimated Complexity:** XS (1 point).
13. **Priority:** P0 (Critical).
14. **Definition of Done:** 403 HTTP error returned for non-owner requests; unit test passes.

#### ISSUE P0-02: Citizen Public GPS Coordinate Fuzzing & Differential Privacy
1. **Title:** Implement Public GPS Coordinate Fuzzing for Citizen Stray Reports & Alerts
2. **Current Code Evidence:** `backend/src/controllers/reports.controller.ts` line 18 (`listReports`).
3. **Problem:** Precise GPS coordinates returned to public feeds expose reporters and vulnerable stray animals.
4. **Desired Behavior:** Public API returns fuzzed coordinates (~200m offset); exact coordinates restricted to assigned municipal workers and shelter admins.
5. **Affected Users:** Citizens, Municipal Workers.
6. **Frontend Work:** Show approximate circle radius on Map for citizen view.
7. **Backend Work:** Implement `fuzzCoordinates(lat, lng)` helper in `geo.service.ts` and apply based on `req.user.role`.
8. **Database Changes:** None.
9. **Security & Permissions:** Protect user location privacy under GDPR.
10. **Tests:** Unit test for `fuzzCoordinates` asserting distance within 150m-300m range.
11. **Dependencies:** None.
12. **Estimated Complexity:** S (2 points).
13. **Priority:** P0 (Critical).
14. **Definition of Done:** Citizens receive fuzzed coordinates; municipal workers receive exact coordinates; test suite passes.

#### ISSUE P0-03: Real OAuth Google/Apple Token Verification
1. **Title:** Replace Dummy OAuth Token Exchange with Production Verification SDK
2. **Current Code Evidence:** `backend/src/services/oauth.service.ts` line 25 (`verifyOAuthToken`).
3. **Problem:** OAuth verification relies on fallback placeholder logic when credentials are missing.
4. **Desired Behavior:** Use `google-auth-library` and `apple-signin-auth` to verify ID tokens against provider public keys.
5. **Affected Users:** All Users.
6. **Frontend Work:** Send real Google/Apple ID token strings from Expo Auth Session.
7. **Backend Work:** Integrate official Google/Apple token validation in `oauth.service.ts`.
8. **Database Changes:** None.
9. **Security & Permissions:** Prevent account takeover via forged OAuth subject IDs.
10. **Tests:** Integration test mocking Google/Apple OAuth JWKS public keys.
11. **Dependencies:** `google-auth-library`, `apple-signin-auth`.
12. **Estimated Complexity:** M (3 points).
13. **Priority:** P0 (Critical).
14. **Definition of Done:** Genuine OAuth tokens verified; invalid tokens rejected with 401/403.

---

### PRIORITY P1: HIGH WELFARE IMPACT & CORE OPERATIONS

#### ISSUE P1-01: Rescue Dispatch & Field Tracking Console
1. **Title:** Implement Real-Time Rescue Dispatch & Field Volunteer Management
2. **Current Code Evidence:** Missing in `backend/src/routes/reports.routes.ts` & `mobile/src/screens/`.
3. **Problem:** Municipalities cannot dispatch specific field rescue units or track active rescue status.
4. **Desired Behavior:** Field dispatch state machine (`UNASSIGNED` → `DISPATCHED` → `EN_ROUTE` → `ON_SCENE` → `RESOLVED` / `TRANSPORTED_TO_VET`) with real-time assignment.
5. **Affected Users:** Municipal Workers, Rescue Volunteers.
6. **Frontend Work:** Create `RescueDispatchScreen.tsx` with live dispatch action buttons and map routing.
7. **Backend Work:** Create `/api/rescue-dispatch` routes, controllers, and FCM dispatch alert trigger.
8. **Database Changes:** Add `RescueDispatch` and `RescueDispatchLog` Prisma models.
9. **Security & Permissions:** Require `MUNICIPAL_WORKER` or `VOLUNTEER` role.
10. **Tests:** E2E dispatch state transition integration test.
11. **Dependencies:** PostGIS / FCM Push Service.
12. **Estimated Complexity:** L (5 points).
13. **Priority:** P1 (High).
14. **Definition of Done:** Worker dispatches rescue, volunteer receives push notification, updates state to `ON_SCENE`.

#### ISSUE P1-02: Municipality Response SLA Management & Escalation Engine
1. **Title:** Implement Municipality Triage Response SLA Timers & Automated Escalations
2. **Current Code Evidence:** `backend/src/services/municipality.service.ts`.
3. **Problem:** Reports can sit unresolved indefinitely without municipal response benchmarks.
4. **Desired Behavior:** Enforce SLA response windows based on condition (`CRITICAL`: 2h, `INJURED`: 6h, `STABLE`: 24h) with automated supervisor escalation.
5. **Affected Users:** Municipal Workers, Platform Admins.
6. **Frontend Work:** Add SLA status badge (`ON_TIME`, `SLA_WARNING`, `SLA_BREACHED`) in `MunicipalWorkerScreen.tsx`.
7. **Backend Work:** Background cron job evaluating `StrayReport` SLA timers and firing escalation notifications.
8. **Database Changes:** Add `slaTargetAt` and `slaStatus` fields to `StrayReport` model.
9. **Security & Permissions:** Municipal admin visibility.
10. **Tests:** Cron job unit test asserting escalation triggered for overdue reports.
11. **Dependencies:** Node cron or BullMQ queue.
12. **Estimated Complexity:** M (3 points).
13. **Priority:** P1 (High).
14. **Definition of Done:** Overdue critical reports marked `SLA_BREACHED` and escalated.

#### ISSUE P1-03: Shelter Intake, Physical Capacity & Quarantine Isolation
1. **Title:** Implement Shelter Intake Management, Physical Capacity Tracking & Quarantine Units
2. **Current Code Evidence:** `backend/src/services/adoption-application.service.ts`.
3. **Problem:** Shelters cannot track total capacity, kennel occupancy, or active medical quarantine status.
4. **Desired Behavior:** Record shelter capacity limits, active occupancy, and quarantine medical isolation flags.
5. **Affected Users:** Shelter Admins, Vets.
6. **Frontend Work:** Add capacity gauge and quarantine isolation tab in `ShelterAdminScreen.tsx`.
7. **Backend Work:** Add capacity calculation services and intake management endpoints in `adoption.controller.ts`.
8. **Database Changes:** Add `totalCapacity`, `quarantineCapacity` to User/Shelter profile, add `isQuarantined` to `PetForAdoption`.
9. **Security & Permissions:** Restrict to `SHELTER_ADMIN`.
10. **Tests:** Test asserting error when adding pet exceeding total shelter capacity.
11. **Dependencies:** None.
12. **Estimated Complexity:** M (3 points).
13. **Priority:** P1 (High).
14. **Definition of Done:** Occupancy percentage calculated live; pets in quarantine isolated from public adoption list.

#### ISSUE P1-04: Offline Rescue Reporting & SQLite Queue Worker
1. **Title:** Implement Mobile Offline Stray Reporting with Background Synchronization
2. **Current Code Evidence:** `mobile/src/screens/ReportScreen.tsx`.
3. **Problem:** Field reports fail instantly if the citizen or volunteer lacks active cellular data.
4. **Desired Behavior:** Save report offline locally in SQLite/AsyncStorage queue and sync automatically upon network reconnection.
5. **Affected Users:** Citizens, Field Volunteers.
6. **Frontend Work:** Add `offlineQueueStore` using Zustand + AsyncStorage, offline indicator badge, and sync worker listener.
7. **Backend Work:** Ensure `/api/reports` supports idempotent submission key (`idempotencyKey`).
8. **Database Changes:** Add `idempotencyKey` index to `StrayReport` model.
9. **Security & Permissions:** Token authentication on queue flush.
10. **Tests:** Mobile store unit test for queue enqueue, retry, and flush on network reconnect.
11. **Dependencies:** `@react-native-community/netinfo`.
12. **Estimated Complexity:** L (5 points).
13. **Priority:** P1 (High).
14. **Definition of Done:** Report submitted offline saves locally; flushed automatically when back online.

---

### PRIORITY P2: ENHANCED FEATURES & GEOSPATIAL OPTIMIZATIONS

#### ISSUE P2-01: PostGIS Native Spatial Geofencing & ST_DWithin Integration
1. **Title:** Refactor Geofencing & Location Search to Native PostGIS ST_DWithin
2. **Current Code Evidence:** `backend/src/services/geo.service.ts`.
3. **Problem:** Spatial queries use in-memory Haversine math or raw SQL float approximations.
4. **Desired Behavior:** Migrate location fields to PostGIS `geography(Point, 4326)` with GIST spatial indexing and native `ST_DWithin` queries.
5. **Affected Users:** All Users.
6. **Frontend Work:** None (API signature remains transparent).
7. **Backend Work:** Update Prisma queries with raw PostGIS queries (`ST_DWithin`, `ST_SetSRID`, `ST_MakePoint`).
8. **Database Changes:** Add PostGIS spatial column extension migration and GIST index.
9. **Security & Permissions:** Standard API authorization.
10. **Tests:** Database benchmark integration test comparing query timing for 100,000 spatial records.
11. **Dependencies:** PostGIS PostgreSQL extension.
12. **Estimated Complexity:** L (5 points).
13. **Priority:** P2 (Medium).
14. **Definition of Done:** PostGIS GIST indexes active; spatial queries execute via `ST_DWithin`.

#### ISSUE P2-02: Verified Vet Digital Signature & Prescription System
1. **Title:** Implement Verified Vet Credentials, Digital Signatures & Electronic Prescriptions
2. **Current Code Evidence:** `backend/src/services/medical-records.service.ts`.
3. **Problem:** Medical records can be added by any user without verified vet license validation.
4. **Desired Behavior:** Allow verified vets (`VET` role) to sign medical records digitally and issue official prescriptions.
5. **Affected Users:** Veterinarians, Pet Owners, Shelter Admins.
6. **Frontend Work:** Create `VetVerificationScreen.tsx` and digital signature badge in `MedicalRecordsScreen.tsx`.
7. **Backend Work:** Add `VET` role, vet license verification service, and cryptographic record hash signature.
8. **Database Changes:** Add `vetLicenseNumber`, `isVetVerified` to User; add `digitalSignature` to `PetMedicalRecord`.
9. **Security & Permissions:** Enforce `VET` role for official medical verification.
10. **Tests:** Unit test asserting non-vets cannot create signed medical records.
11. **Dependencies:** Node crypto RSA/ECDSA signing.
12. **Estimated Complexity:** M (3 points).
13. **Priority:** P2 (Medium).
14. **Definition of Done:** Verified vets produce signed medical records with tamper-proof signature hashes.

#### ISSUE P2-03: AI Breed Identification & Visual Duplicate Detection
1. **Title:** Integrate AI Vision Model for Pet Breed Identification & Duplicate Report Detection
2. **Current Code Evidence:** `mobile/src/screens/SmartMatchmakerScreen.tsx`.
3. **Problem:** Duplicate stray reports for the same animal waste municipal rescue resources.
4. **Desired Behavior:** Analyze uploaded photo on report submission, compare image embedding vectors, and warn user of potential duplicates within 100m.
5. **Affected Users:** Citizens, Municipal Workers.
6. **Frontend Work:** Show "Similar active report found nearby" modal with image preview.
7. **Backend Work:** Add image embedding comparison service or integrate lightweight vision API (e.g. MobileNet / OpenAI Vision).
8. **Database Changes:** Add `imageEmbedding` vector column to `StrayReport`.
9. **Security & Permissions:** Standard reporting permission.
10. **Tests:** Integration test asserting duplicate alert triggered for identical image embedding.
11. **Dependencies:** Vision ML model / API service.
12. **Estimated Complexity:** XL (8 points).
13. **Priority:** P2 (Medium).
14. **Definition of Done:** High similarity photos within 100m flag duplicate warnings to user before submission.

---

### PRIORITY P3: EXPANSION & INTERNATIONAL ADAPTATION

#### ISSUE P3-01: Multi-Organization Membership Model
1. **Title:** Refactor User Roles to Multi-Organization Member Permissions
2. **Current Code Evidence:** `backend/prisma/schema.prisma` (`User.role`).
3. **Problem:** Single static role on `User` prevents a user from belonging to multiple shelters or NGOs.
4. **Desired Behavior:** Introduce `Organization` and `OrganizationMember` models with granular per-org permission scopes.
5. **Affected Users:** Shelter Admins, NGO Workers, Municipalities.
6. **Frontend Work:** Add Organization switcher dropdown in app drawer.
7. **Backend Work:** Refactor auth middleware to accept `X-Organization-Id` header and check org-scoped permissions.
8. **Database Changes:** Migration adding `Organization` and `OrganizationMember` models.
9. **Security & Permissions:** Multi-tenant organization isolation.
10. **Tests:** Multi-tenant test verifying User A can edit Shelter X pets but forbidden on Shelter Y.
11. **Dependencies:** None.
12. **Estimated Complexity:** XL (8 points).
13. **Priority:** P3 (Expansion).
14. **Definition of Done:** Organization model active; role checks scoped to active organization context.

#### ISSUE P3-02: Open Animal Welfare API & Developer Portal
1. **Title:** Implement Public Open API Gateway & Rate-Limited Developer Keys
2. **Current Code Evidence:** Missing.
3. **Problem:** External animal welfare NGOs and researchers cannot integrate with platform data programmatically.
4. **Desired Behavior:** Provide `/api/v1/open/` public endpoints for adoptable pets and anonymized stray statistics with API key rate limits.
5. **Affected Users:** Third-party Developers, Research Institutions.
6. **Frontend Work:** Developer Portal web page for API key generation.
7. **Backend Work:** Create `ApiKey` model, API key validation middleware, and public open routes.
8. **Database Changes:** Add `ApiKey` table (`keyHash`, `ownerId`, `rateLimit`).
9. **Security & Permissions:** Strict per-key rate limiting and read-only access.
10. **Tests:** Integration test asserting rate limit enforcement on public API keys.
11. **Dependencies:** Express rate limit.
12. **Estimated Complexity:** L (5 points).
13. **Priority:** P3 (Expansion).
14. **Definition of Done:** Developers generate API keys and fetch open data via `/api/v1/open/pets`.
