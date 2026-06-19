import type { ServerPane } from '@/locales/el';

export const en: ServerPane = {
  errors: {
    UNAUTHORIZED: 'Authentication required',
    MISSING_TOKEN: 'Missing token',
    BAD_DEV_TOKEN: 'Bad X-Dev-Token',
    INVALID_TOKEN: 'Invalid or expired token',
    FORBIDDEN: 'You are not allowed to perform this action',
    NOT_FOUND: 'Resource not found',
    APPLICATION_NOT_FOUND: 'This application could not be found',
    ALERT_NOT_FOUND: 'This poison alert could not be found',
    STRAY_REPORT_NOT_FOUND: 'This stray report could not be found',
    EMAIL_TAKEN: 'That email is already in use',
    INVALID_CREDENTIALS: 'Wrong email or password',
    REFRESH_REJECTED: 'Refresh token revoked or expired',
    STEP_UP_REQUIRED: 'Two-factor confirmation required for “{{capability}}”',
    VALIDATION_ERROR: 'Invalid data',
    RATE_LIMITED: 'Too many requests, please try again later',
    ILLEGAL_TRANSITION: 'Illegal state transition: {{from}} → {{to}}',
    APPLICATION_EXISTS: 'You already have an active application for this pet',
    NO_HOME_LOCATION: 'Set your home location first',
    NO_PUSH_TOKEN: 'No push token registered for this account',
    STALE_STATE: 'This record was updated by another user — refresh and try again',
    INTERNAL_SERVER_ERROR: 'An unexpected error occurred',

    INVALID_STATUS: 'Invalid status value',
    BAD_GUARD_ROLE_TIMELINE:
      'Only municipal workers or shelter admins can post timeline updates',
    BAD_GUARD_ROLE_APPLICATION: 'This action is not allowed for your current role',
    GEO_BAD_PARAMS: 'Valid lat and lng query parameters are required',
    HOME_LOCATION_REQUIRED_FOR_TEST:
      'Set a home location to receive a test push notification',
  },

  email: {
    verifySubject: 'Verify your email — Pet-Match & Care',
    verifyTitle: 'Verify your email',
    verifyBody:
      'Welcome to <strong>Pet-Match &amp; Care</strong>! Before you can submit adoption applications and receive poison alerts within 2 km, please confirm your email.',
    verifyCta: '✓ Verify email',
    verifyDisclaimer: 'This link expires in <strong>30 minutes</strong>. If you did not request it, you can ignore this message — nothing will happen.',
    verifyFallback: 'If you don’t have the app, you can also verify on the web:',

    resetSubject: 'Reset your password — Pet-Match & Care',
    resetTitle: 'Reset your password',
    resetBody: 'We received a request to reset the password for your account.',
    resetBodyContinued:
      'Tap the button below to set a new password. We will automatically sign you out of every device once the reset is complete.',
    resetCta: '🔐 Set new password',
    resetDisclaimer: 'This link expires in 30 minutes. If you did not request this, your account is safe.',
    resetFallback: 'If you don’t have the app, use the web link instead:',

    adoptionTitle: 'Update on your adoption application',
    adoptionSubject: 'Adoption update: {{pet}}',
    adoptionGreeting: 'Hi <strong>{{username}}</strong>,',
    adoptionBody: 'There’s an update on your application for <strong>{{pet}}</strong>.',
    adoptionCta: 'View your application',

    footerBrand: 'Pet-Match & Care · Stray management',
    footerContext: 'You received this message because you signed up to our app.',
  },

  adoption: {
    stateLabels: {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      SCREENING: 'Screening',
      HOME_CHECK_SCHEDULED: 'Home check',
      APPROVED: 'Approved 🎉',
      REJECTED: 'Rejected',
      ADOPTION_COMPLETED: 'Completed',
      CLOSED: 'Closed',
    },
  },
};
