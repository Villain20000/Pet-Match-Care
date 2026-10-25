# PET-MATCH & CARE — COMPREHENSIVE TESTING STRATEGY

**Date:** March 2025
**Version:** 1.0.0
**Target Quality Gate:** 85%+ Statement Coverage, 100% i18n Catalog Parity, 0 TypeScript/ESLint Errors.

---

## 1. CURRENT TESTING INVENTORY & GAP ANALYSIS

### Existing Validation Scripts (Passing):
- **`npm run test:catalog`**: Bi-directional catalog parity audit checking 892 translation leaves between Greek (`el`) and English (`en`) across backend and mobile.
- **`npm run test:i18n`**: 22-case E2E test suite verifying HTTP status codes, localized error envelopes, Zod validation errors, and `Accept-Language` header vs. `user.locale` precedence.
- **`npm run test:email`**: Deep link interpolation (`petmatchcare://reset-password`), HTML escaping, and rendering verification.
- **`npm run test:toast:visual`**: Visual token verification for Toast notifications across color-blind palettes.

### Critical Testing Gaps:
1. **Missing Backend Unit Test Runner**: No Jest / Vitest framework configured for isolated service method unit tests.
2. **Missing Mobile Component & Integration Tests**: No `@testing-library/react-native` tests for forms, screen navigation, or state hooks.
3. **Missing E2E Mobile Automation**: No Detox / Playwright E2E automation for full mobile user journeys.
4. **Database Test Isolation**: Tests run directly against standard database instance without transaction rollback hooks or isolated test DB containers.

---

## 2. MULTI-TIER TESTING ARCHITECTURE

```
+-----------------------------------------------------------------------+
|                       Tier 4: E2E Automation                          |
|             (Detox Mobile / Playwright Web User Journeys)             |
+-----------------------------------------------------------------------+
                                    ^
                                    |
+-----------------------------------------------------------------------+
|                    Tier 3: API & DB Integration                        |
|        (Supertest + Prisma Test DB Transactions + FCM/Email Mocks)    |
+-----------------------------------------------------------------------+
                                    ^
                                    |
+-----------------------------------------------------------------------+
|                   Tier 2: Unit & Component Tests                      |
|         (Vitest Service Tests + React Native Testing Library)         |
+-----------------------------------------------------------------------+
                                    ^
                                    |
+-----------------------------------------------------------------------+
|                     Tier 1: Static Quality Gates                      |
|        (TypeScript tsc + ESLint + Catalog Parity + Toast Visual)      |
+-----------------------------------------------------------------------+
```

---

## 3. COVERAGE TARGETS & SUITE SPECIFICATIONS

### Tier 1: Static Quality Gates & Parity Audits
- **Commands:** `npm run typecheck`, `npm run lint`, `npm run test:catalog`, `npm run test:toast:visual`.
- **Target:** 100% type soundness, 0 lint warnings, 100% translation key parity across 892 leaves.

### Tier 2: Unit Testing (Vitest)
- **Target Coverage:** 85%+ Line Coverage, 100% State Machine Path Coverage.
- **Key Unit Test Suites:**
  - `adoption-state-machine.test.ts`: Verify valid state transitions (`DRAFT` → `SUBMITTED` → `SCREENING` → `HOME_CHECK_SCHEDULED` → `APPROVED` / `REJECTED`) and block invalid jumps (`SUBMITTED` → `APPROVED`).
  - `badges-engine.test.ts`: Test predicate evaluation for badge unlocking (`REPORTS_CREATED`, `KARMA_REACHED`, `STREAK_REACHED`).
  - `geo-distance.test.ts`: Verify distance calculation functions and municipal bounding box containment.

### Tier 3: API & Database Integration Testing (Supertest + Vitest)
- **Target Coverage:** 80%+ Endpoint Coverage.
- **Key Integration Suites:**
  - `auth-flow.integration.test.ts`: Registration, login, JWT token refresh, 2FA setup, recovery code usage.
  - `reports-routing.integration.test.ts`: Stray report creation, nearest municipality auto-assignment, karma award verification.
  - `poison-alerts.integration.test.ts`: Hazard reporting, 2 km geofence radius user notification targeting, expiration handling.
  - `adoption-application.integration.test.ts`: Applicant questionnaire submission, shelter admin state changes, home check audit logging.

### Tier 4: Mobile Screen & Visual Component Testing (React Native Testing Library)
- **Target Coverage:** 70%+ Screen Component Coverage.
- **Key Mobile Suites:**
  - `ReportScreen.test.tsx`: Form input validation, image picker mock, GPS coordinate fetching, error toast rendering.
  - `AdoptionApplicationScreen.test.tsx`: Questionnaire wizard navigation, payload construction, submit button disable during loading.
  - `ThemeAccessibility.test.tsx`: High contrast token applying and color-blind palette matrix rendering.

---

## 4. CI/CD AUTOMATION PIPELINE

```yaml
name: Pet-Match & Care CI Quality Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Backend Static Gates
        run: |
          cd backend
          npm ci
          npm run typecheck
          npm run lint
          npm run test:catalog

      - name: Mobile Static Gates
        run: |
          cd mobile
          npm ci
          npm run typecheck
          npm run lint
          npm run test:toast:visual

  integration-tests:
    needs: quality-gates
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:15-3.3
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: petmatch_test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Run Backend Integration & i18n Suite
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/petmatch_test
          JWT_SECRET: supersecrettestkey12345678901234567890
          GREEK_MUNICIPALITIES: Athina,Thessaloniki,Patra
        run: |
          cd backend
          npm ci
          npx prisma migrate deploy
          npm run test:i18n
          npm run test:email
```
