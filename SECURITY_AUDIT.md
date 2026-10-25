# PET-MATCH & CARE — SECURITY AUDIT & PRIVACY COMPLIANCE ANALYSIS

**Date:** March 2025
**Version:** 1.0.0
**Scope:** Express REST API, Authentication System, Prisma Database Schemas, UGC Mechanisms, and Mobile Client Privacy.

---

## 1. VULNERABILITY & ACCESS CONTROL ASSESSMENT

### SEC-01: Object-Level Authorization (IDOR) on Adoption Application Audits
- **Severity:** `HIGH`
- **Location:** `backend/src/controllers/adoption-applications.controller.ts`
- **Issue:** Application audit history endpoints allow any authenticated user to view audit trails if they possess the application UUID, without verifying that the user is the applicant, shelter admin, or assigned worker.
- **Remediation:** Introduce `assertApplicationAccess(userId, userRole, applicationId)` middleware/helper verifying object ownership or shelter administrative ownership before returning records.

### SEC-02: Precise GPS Disclosure & Citizen Safety Risk
- **Severity:** `HIGH`
- **Location:** `backend/src/controllers/reports.controller.ts`, `alerts.controller.ts`.
- **Issue:** Exact latitude and longitude coordinates are broadcast publicly. In stray reports and foster home locations, exact coordinates expose citizens or vulnerable animals to malicious tracking or poison threats.
- **Remediation:** Implement server-side coordinate truncation / fuzzing (offsetting coordinates by 100-300m) for non-administrative roles (`CITIZEN`). Retain exact coordinates only for assigned `MUNICIPAL_WORKER` or `SHELTER_ADMIN`.

### SEC-03: Rate Limiting & Brute-Force Vulnerability on Auth Endpoints
- **Severity:** `MEDIUM`
- **Location:** `backend/src/middlewares/rate-limit.ts`, `backend/src/routes/auth.routes.ts`.
- **Issue:** Global rate limiting applies, but route-specific strict limits are missing on `/api/auth/login`, `/api/auth/forgot-password`, and `/api/auth/verify-2fa`. An attacker can attempt password or TOTP brute-force attacks within the global limit.
- **Remediation:** Apply strict per-IP and per-account rate limiters (e.g., maximum 5 failed attempts per 15-minute window) using Express rate limiter memory/Redis stores.

### SEC-04: Unrestricted External Image URL Input
- **Severity:** `MEDIUM`
- **Location:** `backend/src/controllers/reports.controller.ts`, `adoption.controller.ts`.
- **Issue:** Reports and pets accept arbitrary `imageUrl` strings without checking origin domain, MIME type, or downloading/validating image payloads. Potential for SSRF, broken links, or malicious image hosting.
- **Remediation:** Implement S3/Cloudinary direct presigned URL upload with file signature/MIME type validation and EXIF metadata stripping (removing location metadata from uploaded photos).

### SEC-05: OAuth Token Exchange Mock Fallback in Production
- **Severity:** `HIGH`
- **Location:** `backend/src/services/oauth.service.ts`.
- **Issue:** `oauth.service.ts` includes fallback dummy validation logic when OAuth keys are unconfigured, allowing mock tokens to simulate successful Google/Apple logins.
- **Remediation:** Enforce strict throwing of `HttpError(500, 'OAUTH_NOT_CONFIGURED')` when credentials are missing in non-test environments.

---

## 2. PRIVACY & GDPR COMPLIANCE ASSESSMENT

| Requirement | Current Status | Risk / Gap | Action Required |
| --- | --- | --- | --- |
| **Right to Erasure (Article 17)** | `PARTIAL` | Deleting a `User` cascades to deleted reports, breaking municipal report audit trails. | Implement soft-delete and PII anonymization (scrubbing `email`, `fullName`, `avatarUrl`, `pushToken` while retaining anonymized report counts). |
| **Data Portability (Article 20)** | `MISSING` | No endpoint exists for users to download their personal data in machine-readable JSON format. | Implement `GET /api/users/me/export` returning profile, submitted reports, adoption history, and messages. |
| **Consent & Terms Logging** | `PARTIAL` | Registration records user, but does not record explicit consent version/timestamp. | Store `termsAcceptedAt` timestamp and `privacyPolicyVersion` on `User` model. |
| **Data Retention Controls** | `PARTIAL` | Resolved stray reports and expired poison alerts persist indefinitely in DB. | Implement automated background purge/archival job for expired alerts (> 30 days). |

---

## 3. APP STORE POLICY COMPLIANCE (GOOGLE PLAY & APPLE APP STORE)

- **UGC Moderation (Google Play Policy):** `COMPLETE`
  `ContentReport` and `UserBlock` models exist and allow users to report inappropriate posts/comments and block abusive accounts.
- **Account Deletion Requirement (Apple App Store Guidelines):** `COMPLETE`
  In-app account deletion flow is present on `ProfileScreen.tsx` and connected to backend account termination.
- **Biometric Data Safety:** `COMPLETE`
  Biometric authentication uses Expo `LocalAuthentication` and local device secure enclave without transmitting biometric data to backend.
