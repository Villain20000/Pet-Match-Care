# PET-MATCH & CARE — FEATURE AUDIT & USER JOURNEY MATRIX

**Date:** March 2025
**Version:** 1.0.0
**Scope:** Complete repository source-code audit covering backend Express/Prisma API, mobile React Native client, database schema, security, and user workflows.

---

## 1. EXECUTIVE SUMMARY & FEATURE DOMAIN VERIFICATION

Every feature across the 25 core domains and 20 expanded features has been inspected against the source code (`backend/src/` and `mobile/src/`). Below is the classification matrix.

### Classification Key:
- **COMPLETE**: Fully implemented, connected end-to-end (UI + API + DB + Localization), and passing runtime assertions.
- **PARTIAL**: Backend API and UI exist, but specific edge-case workflows or deep interactions are missing or unhandled.
- **UI_ONLY**: Mobile screen or component exists with mock state or unhandled submission, without backend route integration.
- **BACKEND_ONLY**: Express routes and Prisma models exist, but no corresponding mobile screen or user-facing interface exists.
- **MOCKED**: Stubbed data or dummy responses without persistence or business logic.
- **BROKEN**: Code exists but throws runtime errors, unhandled exceptions, or failing state transitions.
- **MISSING**: Not implemented in either frontend or backend.
- **UNVERIFIED**: Cannot be verified due to missing third-party external environment dependencies.

---

## 2. CORE DOMAINS AUDIT (25 DOMAINS)

### Domain 1: Authentication & Identity
- **Status:** `COMPLETE` (with `PARTIAL` OAuth)
- **Backend Evidence:** `backend/src/controllers/auth.controller.ts`, `totp.controller.ts`, `oauth.controller.ts`, `backend/src/middlewares/auth.ts`.
- **Frontend Evidence:** `mobile/src/screens/LoginScreen.tsx`, `AuthGateScreen.tsx`, `TwoFactorSetupScreen.tsx`, `ForgotPasswordScreen.tsx`, `ResetPasswordScreen.tsx`.
- **Findings:** Dual-token JWT auth with refresh token rotation (`RefreshToken` model), 2FA step-up with TOTP authenticator app (`totpSecretEnc`), password reset deep-linking (`petmatchcare://reset-password`), email verification. Google/Apple OAuth is stubbed on backend (`oauth.service.ts` placeholder token verification).
- **Impacted Roles:** All Roles (`CITIZEN`, `VOLUNTEER`, `MUNICIPAL_WORKER`, `SHELTER_ADMIN`, `PLATFORM_ADMIN`).

### Domain 2: Citizens & Profiles
- **Status:** `COMPLETE`
- **Backend Evidence:** `backend/src/controllers/auth.controller.ts`, `backend/src/services/auth.service.ts`.
- **Frontend Evidence:** `mobile/src/screens/ProfileScreen.tsx`, `SettingsScreen.tsx`, `PrivacyPolicyScreen.tsx`.
- **Findings:** Avatar selection, full name updates, push token registration, locale toggle (`el` / `en`), high-contrast and color-blind vision modes, biometric unlock preferences.

### Domain 3: Stray Animal Reporting
- **Status:** `COMPLETE`
- **Backend Evidence:** `backend/src/controllers/reports.controller.ts`, `backend/src/services/municipality.service.ts`.
- **Frontend Evidence:** `mobile/src/screens/ReportScreen.tsx`, `MunicipalWorkerScreen.tsx`.
- **Findings:** Citizens submit report with image URL, condition (`STABLE`, `INJURED`, `CRITICAL`, `DECEASED`), description, GPS coords. Backend auto-routes report to nearest Greek municipality via spatial bounding box / nearest distance. Earns 15 karma points and evaluates badge triggers.

### Domain 4: Emergency & Poison Alerts (Φόλες)
- **Status:** `COMPLETE`
- **Backend Evidence:** `backend/src/controllers/alerts.controller.ts`, `backend/src/services/fcm.service.ts`.
- **Frontend Evidence:** `mobile/src/screens/MapScreen.tsx`, `ReportScreen.tsx`.
- **Findings:** Emergency hazard reporting with severity (`HIGH`, `CRITICAL`). Calculates 2 km geofence radius using Haversine formula and dispatches FCM push notifications to users within range. Alerts expire automatically after set duration.

### Domain 5: Municipality Operations
- **Status:** `PARTIAL`
- **Backend Evidence:** `backend/src/routes/municipalities.routes.ts`, `backend/src/controllers/reports.controller.ts`.
- **Frontend Evidence:** `mobile/src/screens/MunicipalWorkerScreen.tsx`.
- **Findings:** Workers can view stray reports assigned to their municipality and update status (`ASSIGNED`, `IN_PROGRESS`, `RESOLVED`). However, SLA tracking, response time targets, and municipal boundary geoJSON management are missing.

### Domain 6: Rescue Dispatch
- **Status:** `MISSING`
- **Findings:** No dedicated rescue dispatch coordination console, real-time vehicle/volunteer GPS tracking, or active dispatch status machine (`DISPATCHED`, `EN_ROUTE`, `ON_SCENE`, `TRANSPORTING`, `DELIVERED_TO_VET`).

### Domain 7: Volunteer Management
- **Status:** `PARTIAL`
- **Backend Evidence:** `backend/src/services/foster.service.ts`, `backend/src/routes/extra-features.routes.ts`.
- **Frontend Evidence:** `mobile/src/screens/FosterScreen.tsx`.
- **Findings:** Foster profiles can be created (`city`, `maxPets`, `preferredSpecies`, `hasGarden`, `hasOtherPets`). Volunteer shift scheduling, task assignments, and field activity logs are missing.

### Domain 8: Shelter Management
- **Status:** `PARTIAL`
- **Backend Evidence:** `backend/src/controllers/adoption.controller.ts`, `backend/src/controllers/adoption-applications.controller.ts`.
- **Frontend Evidence:** `mobile/src/screens/ShelterAdminScreen.tsx`.
- **Findings:** Shelter admins can add adoptable pets, toggle urgency/medical statuses, and review/advance adoption application states. Intake management, capacity/occupancy calculations, and quarantine tracking are missing.

### Domain 9: Adoption Applications
- **Status:** `COMPLETE`
- **Backend Evidence:** `backend/src/services/adoption-application.service.ts`, `backend/src/routes/adoption-applications.routes.ts`.
- **Frontend Evidence:** `mobile/src/screens/AdoptionApplicationScreen.tsx`, `MyApplicationsScreen.tsx`.
- **Findings:** Multi-step state machine (`DRAFT` → `SUBMITTED` → `SCREENING` → `HOME_CHECK_SCHEDULED` → `APPROVED` / `REJECTED` / `ADOPTION_COMPLETED` / `CLOSED`). Includes home check schedule/inspector notes audit logs (`ApplicationAudit` model).

### Domain 10: Foster Care
- **Status:** `PARTIAL`
- **Backend Evidence:** `backend/src/services/foster.service.ts`.
- **Frontend Evidence:** `mobile/src/screens/FosterScreen.tsx`.
- **Findings:** Volunteer foster profile listing and search by city/species. Full placement lifecycle (placing pet with foster parent, foster duration, agreement signatures, handover records) is missing.

### Domain 11: Veterinary Health Records
- **Status:** `PARTIAL`
- **Backend Evidence:** `backend/src/services/medical-records.service.ts`, `backend/src/routes/timeline.routes.ts`.
- **Frontend Evidence:** `mobile/src/screens/MedicalRecordsScreen.tsx`, `TimelineScreen.tsx`.
- **Findings:** Pet medical records can be listed and added (`VACCINE`, `DEWORMING`, `SURGERY`, `EXAMINATION`, `TREATMENT`). Verified vet digital signatures, clinic authorization, and official prescription attachments are missing.

### Domain 12: Lost-and-Found Matching
- **Status:** `PARTIAL`
- **Backend Evidence:** `backend/src/controllers/lost-pets.controller.ts`, `backend/src/services/lost-pets.service.ts`.
- **Frontend Evidence:** `mobile/src/screens/LostPetScreen.tsx`.
- **Findings:** Lost pet posting and sighting submission (`LostPetSighting` model). Automated AI breed/photo matching or spatial proximity auto-matching between missing and found pets is missing.

### Domain 13: Pet-Friendly Places
- **Status:** `COMPLETE`
- **Backend Evidence:** `backend/src/controllers/spots.controller.ts`.
- **Frontend Evidence:** `mobile/src/screens/MapScreen.tsx`.
- **Findings:** Interactive map display, place creation by category (`PARK`, `BEACH`, `CAFE`, `VET`, etc.), upvoting/downvoting with crowd verification (>= 3 upvotes sets `isVerified = true`), content flagging.

### Domain 14: Donations & Fundraising
- **Status:** `PARTIAL`
- **Backend Evidence:** `backend/src/services/donations.service.ts`.
- **Frontend Evidence:** `mobile/src/screens/DonationsScreen.tsx`.
- **Findings:** Emergency shelter campaigns creation, progress bar, needed item checklist. Stripe/Payment gateway integration is mocked/simulated (no real payment processor SDK).

### Domain 15: Community & Forum
- **Status:** `COMPLETE`
- **Backend Evidence:** `backend/src/controllers/ugc.controller.ts`, `backend/src/services/ugc.service.ts`.
- **Frontend Evidence:** `mobile/src/screens/CommunityForumScreen.tsx`.
- **Findings:** Forum post creation by category (`GENERAL`, `VET_QA`, `ADVICE`, `STORIES`), comments, upvoting, UGC content reporting (`ContentReport`), user blocking (`UserBlock`).

### Domain 16: Gamification
- **Status:** `COMPLETE`
- **Backend Evidence:** `backend/src/services/badges.engine.ts`, `streaks.service.ts`, `backend/src/controllers/badges.controller.ts`.
- **Frontend Evidence:** `mobile/src/screens/BadgesScreen.tsx`, `ChallengesScreen.tsx`, `LeaderboardScreen.tsx`.
- **Findings:** Daily login streaks, karma points, automated badge predicate evaluation, community challenges, claimable partner rewards/discounts.

### Domain 17: Notifications & Messaging
- **Status:** `COMPLETE`
- **Backend Evidence:** `backend/src/services/notifications.service.ts`, `chat.service.ts`, `fcm.service.ts`.
- **Frontend Evidence:** `mobile/src/screens/NotificationsScreen.tsx`, `ChatListScreen.tsx`, `ChatRoomScreen.tsx`.
- **Findings:** In-app chat rooms and real-time messaging, notification queue with read/unread tracking, FCM dry-run and live push notifications.

### Domain 18: Maps & PostGIS
- **Status:** `PARTIAL`
- **Backend Evidence:** `backend/src/services/geo.service.ts`.
- **Frontend Evidence:** `mobile/src/screens/MapScreen.tsx`.
- **Findings:** Maps display markers for stray reports, poison alerts, pet spots, and feeding stations. Coordinates stored as `Float` `latitude`/`longitude` with Haversine distance calculations in TS SQL queries rather than native PostGIS `GEOMETRY(Point, 4326)` spatial indexes.

### Domain 19: AI Capabilities
- **Status:** `UI_ONLY` / `MOCKED`
- **Backend Evidence:** `backend/src/routes/extra-features.routes.ts`.
- **Frontend Evidence:** `mobile/src/screens/SmartMatchmakerScreen.tsx`.
- **Findings:** Smart Matchmaker screen exists with lifestyle questionnaires, but matching algorithm uses simple client-side heuristics/mock scoring rather than ML/vector embedding matching. Duplicate photo detection is missing.

### Domain 20: Administration
- **Status:** `PARTIAL`
- **Backend Evidence:** `backend/src/services/admin.service.ts`.
- **Frontend Evidence:** `mobile/src/screens/SettingsScreen.tsx`, `ProfileScreen.tsx`.
- **Findings:** Platform admin role checks and user role modification endpoints exist in backend, but a dedicated web/mobile Platform Admin Dashboard console with system metrics, content moderation queue, and user management is missing.

### Domain 21: Analytics
- **Status:** `MISSING`
- **Findings:** No shelter turnover analytics, stray population density heatmaps, municipality response timing charts, or anonymized welfare research exports.

### Domain 22: Internationalization
- **Status:** `COMPLETE`
- **Backend Evidence:** `backend/src/services/i18n.ts`, `backend/src/middlewares/wire-error.ts`, `scripts/test-catalog-parity.ts`.
- **Frontend Evidence:** `mobile/src/locales/el.ts`, `en.ts`, `mobile/src/services/i18n.ts`.
- **Findings:** 100% catalog parity enforced via CI script (892 leaves verified). Greek (`el`) is source-of-truth, English (`en`) mirror. Dynamic locale resolution via user profile and HTTP headers.

### Domain 23: Accessibility
- **Status:** `COMPLETE`
- **Backend Evidence:** N/A (Client-driven).
- **Frontend Evidence:** `mobile/src/theme/index.ts`, `mobile/src/services/accessibility.ts`, `scripts/test-toast-variants.tsx`.
- **Findings:** High-contrast accessibility theme, built-in color-blind matrix transformations (Deuteranopia, Protanopia, Tritanopia), dynamic font scaling considerations, haptic feedback integration (`expo-haptics`).

### Domain 24: Security & Privacy
- **Status:** `COMPLETE` (with minor gaps)
- **Backend Evidence:** `backend/src/middlewares/auth.ts`, `rate-limit.ts`, `totp.controller.ts`.
- **Frontend Evidence:** `mobile/src/screens/PrivacyPolicyScreen.tsx`, `TwoFactorSetupScreen.tsx`.
- **Findings:** Helmet headers, rate limiting on sensitive routes, TOTP 2FA step-up for high-privilege actions, JWT rotation with family revocation, password hashing via bcrypt, user block/report tools. Gap: Sensitive stray report exact GPS coordinates exposed publicly (lacks privacy buffer/fuzzing for foster/home locations).

### Domain 25: Testing & Deployments
- **Status:** `PARTIAL`
- **Backend Evidence:** `scripts/test-catalog-parity.ts`, `scripts/test-i18n.ts`, `scripts/test-email.ts`.
- **Frontend Evidence:** `scripts/test-toast-variants.tsx`.
- **Findings:** Custom TypeScript testing scripts for catalog parity, i18n error envelopes, email templates, and toast visuals. Missing formal Jest/Vitest unit testing framework, mobile integration tests, and Playwright E2E automation pipelines.

---

## 3. EXPANDED FEATURES EVALUATION

| Expanded Feature | Status | Evidence / Analysis |
| --- | --- | --- |
| **Rescue Dispatch with Real-time Assignment** | `MISSING` | No vehicle/volunteer real-time tracking or dispatch state machine. |
| **Municipality SLA Management** | `MISSING` | No SLA response targets, overdue escalation timers, or completion benchmarks. |
| **Shelter Intake, Occupancy & Quarantine** | `MISSING` | Pets are listed for adoption, but shelter physical capacity and health isolation units are untracked. |
| **Volunteer Availability & Scheduling** | `MISSING` | Volunteer profiles exist, but calendar availability slots and duty shifts are absent. |
| **Foster Care Lifecycle** | `PARTIAL` | `FosterProfile` model exists (`city`, `maxPets`), but formal placement agreements & check-ins are missing. |
| **Veterinary Appointments & Verified Records** | `PARTIAL` | `PetMedicalRecord` exists, but vet appointment booking and vet identity verification seals are missing. |
| **Real-Time Secure Messaging** | `COMPLETE` | `ChatRoom`, `ChatParticipant`, `ChatMessage` Prisma models and mobile chat screens functional. |
| **Offline Rescue Reporting** | `MISSING` | Mobile app relies on live active network connection; no offline SQLite queue/sync worker. |
| **Multi-Organization Permissions** | `PARTIAL` | User roles (`SHELTER_ADMIN`, `MUNICIPAL_WORKER`) tied directly to User model rather than an Organization membership model. |
| **Donation Accounting & Transparency** | `PARTIAL` | `DonationCampaign` model tracks target/raised amounts, but breakdown ledger & expense audit proof are missing. |
| **Adoption Follow-up & Welfare Checks** | `PARTIAL` | `ApplicationHomeCheck` model handles pre-adoption checks; post-adoption periodic welfare audits are missing. |
| **AI Pet Matching & Duplicate Detection** | `MOCKED` | Questionnaire client UI exists (`SmartMatchmakerScreen`), but backend AI embedding/computer vision missing. |
| **Advanced PostGIS Search** | `PARTIAL` | Geofencing uses TS Haversine formulas on `Float` columns; PostGIS extension not natively utilized in queries. |
| **QR / Microchip ID Workflows** | `COMPLETE` | `PetTag` QR code generator (`PetTagScreen.tsx`) and microchip lookup fields functional. |
| **Animal Digital Identity & Custody Trail** | `PARTIAL` | Pet microchip & medical history recorded; complete legal ownership transfer trail missing. |
| **Disaster Animal Rescue** | `PARTIAL` | `PoisonAlert` emergency geofence system usable for disasters, but disaster shelter intake mode is missing. |
| **International NGO Coordination** | `MISSING` | Cross-border pet adoption, translation, or international NGO network coordination absent. |
| **Open Animal Welfare APIs** | `MISSING` | No public API key management, rate-limited open endpoints, or developer portal. |
| **Research Analytics & Anonymized Reporting** | `MISSING` | No anonymized aggregate data export pipelines for academic/policy research. |
| **Multi-Country Policy Configuration** | `MISSING` | Municipal routing logic hardcoded to Greek administrative municipalities (`GREEK_MUNICIPALITIES`). |

---

## 4. END-TO-END USER JOURNEY MATRIX

| User Role | Journey / Workflow | Current Status | Passing / Failing Steps |
| --- | --- | --- | --- |
| **Citizen** | Stray Report Submission & Karma Reward | `PASS` | Submit report with GPS → Auto-route municipality → Award 15 karma → Check badge. |
| **Citizen** | Emergency Poison Alert Notification | `PASS` | Citizen reports poison alert → Calculate 2 km radius → FCM push sent to nearby users. |
| **Citizen** | Adoption Application Journey | `PASS` | Search adoptable pet → Submit application → Receive status updates → Review home check. |
| **Citizen** | Pet-Friendly Spot Crowd Verification | `PASS` | Add spot on map → Other users upvote → Reaches 3 upvotes → Auto-verified badge shown. |
| **Citizen** | QR Tag SOS Scanning | `PASS` | Scan QR tag on lost pet → View owner emergency phone & medical alerts. |
| **Shelter Admin** | Adoption & Medical Record Management | `PASS` | Add pet to adoption list → Add vaccination record → Manage applicant state transitions. |
| **Municipal Worker** | Stray Triage & Field Resolution | `PARTIAL` | View assigned reports → Post status updates → *Fails*: No response SLA timer or map route optimization. |
| **Volunteer** | Foster Profile & Community Feeding | `PASS` | Register foster availability → View community feeding stations and log refill status. |
| **Vet** | Health Record Verification | `FAIL` | Vets log in as `CITIZEN` with no distinct verified vet role, signature key, or appointment calendar. |
| **Platform Admin** | User Role & Content Moderation | `PARTIAL` | API endpoints exist for moderation/role assignment → *Fails*: No dedicated web/mobile admin dashboard UI. |
