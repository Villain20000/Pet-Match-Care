/**
 * Server-side catalog. Same shape constraints as the mobile catalog.
 * Used by `services/i18n.ts` to localize error responses, email
 * templates, and per-request messages. Greek is the source of truth.
 */

export const el = {
  errors: {
    UNAUTHORIZED: 'Απαιτείται σύνδεση',
    MISSING_TOKEN: 'Λείπει το token',
    BAD_DEV_TOKEN: 'Μη έγκυρο X-Dev-Token',
    INVALID_TOKEN: 'Μη έγκυρο ή ληγμένο διακριτικό',
    FORBIDDEN: 'Δεν έχετε δικαίωμα για αυτή την ενέργεια',
    NOT_FOUND: 'Ο πόρος δεν βρέθηκε',
    APPLICATION_NOT_FOUND: 'Η αίτηση δεν βρέθηκε',
    ALERT_NOT_FOUND: 'Η φόλα δεν βρέθηκε',
    STRAY_REPORT_NOT_FOUND: 'Η αναφορά δεν βρέθηκε',
    EMAIL_TAKEN: 'Το email χρησιμοποιείται ήδη',
    INVALID_CREDENTIALS: 'Λάθος email ή κωδικός',
    REFRESH_REJECTED: 'Μη έγκυρο ή ανακλημένο refresh token',
    STEP_UP_REQUIRED: 'Απαιτείται επιβεβαίωση 2FA για την ενέργεια «{{capability}}»',
    VALIDATION_ERROR: 'Μη έγκυρα δεδομένα',
    RATE_LIMITED: 'Πολλές αιτήσεις, δοκιμάστε ξανά σε λίγο',
    ILLEGAL_TRANSITION: 'Μη επιτρεπτή μετάβαση: {{from}} → {{to}}',
    APPLICATION_EXISTS: 'Έχεις ήδη ενεργή αίτηση για αυτό το ζώο',
    NO_HOME_LOCATION: 'Ορίστε την τοποθεσία του σπιτιού σου',
    NO_PUSH_TOKEN: 'Δεν έχει καταχωρηθεί push token',
    STALE_STATE: 'Η αίτηση έχει ενημερωθεί από άλλον χρήστη',
    INTERNAL_SERVER_ERROR: 'Παρουσιάστηκε μη αναμενόμενο σφάλμα',

    INVALID_STATUS: 'Μη επιτρεπτή κατάσταση',
    BAD_GUARD_ROLE_TIMELINE:
      'Μόνο εργαζόμενοι δήμου ή φιλοζωικές μπορούν να ανεβάσουν ενημέρωση',
    BAD_GUARD_ROLE_APPLICATION: 'Δεν επιτρέπεται αυτή η ενέργεια για τον τρέχοντα ρόλο',
    GEO_BAD_PARAMS: 'Απαιτούνται έγκυρα lat και lng query params',
    HOME_LOCATION_REQUIRED_FOR_TEST:
      'Ορίστε την τοποθεσία του σπιτιού σας για να λάβετε δοκιμαστική ειδοποίηση',

    // ---- 2FA / TOTP ----
    TOTP_ALREADY_ENABLED: 'Ο λογαριασμός έχει ήδη 2FA ενεργό',
    TOTP_ENROLLMENT_NOT_STARTED: 'Δεν έχει ξεκινήσει η εγγραφή 2FA',
    TOTP_NOT_ENABLED: 'Το 2FA δεν είναι ενεργό σε αυτόν τον λογαριασμό',
    INVALID_2FA_CODE: 'Λάθος κωδικός 2FA ή κωδικός ανάκτησης',

    // ---- SSO / OAuth ----
    SSO_EMAIL_NOT_VERIFIED: 'Ο πάροχος SSO δεν επαλήθευσε το email',
    SSO_TOKEN_EXCHANGE_FAILED: 'Δεν μπόρεσε η ανταλλαγή με τον πάροχο SSO',
    SSO_USERINFO_FAILED: 'Αποτυχία λήψης στοιχείων από τον πάροχο SSO',
  },

  email: {
    verifySubject: 'Επιβεβαίωσε τη διεύθυνσή σου — Pet-Match & Care',
    verifyTitle: 'Επιβεβαίωσε τη διεύθυνσή σου',
    verifyBody:
      'Καλώς ήρθες στο <strong>Pet-Match &amp; Care</strong>! Για να μπορέσεις να υποβάλεις αιτήσεις υιοθεσίας και να λαμβάνεις ειδοποιήσεις φόλας σε ακτίνα 2 χλμ., επιβεβαίωσε πρώτα τη διεύθυνσή σου.',
    verifyCta: '✓ Επιβεβαίωση email',
    verifyDisclaimer: 'Ο σύνδεσμος λήγει σε <strong>30 λεπτά</strong>. Αν δεν τον ζήτησες εσύ, μπορείς να αγνοήσεις αυτό το μήνυμα χωρίς καμία ενέργεια.',
    verifyFallback: 'Αν δεν έχεις την εφαρμογή, μπορείς επίσης να επιβεβαιώσεις μέσω του web:',

    resetSubject: 'Επαναφορά κωδικού — Pet-Match & Care',
    resetTitle: 'Επαναφορά κωδικού',
    resetBody: 'Λάβαμε αίτημα επαναφοράς κωδικού για τον λογαριασμό σου.',
    resetBodyContinued:
      'Πάτα το παρακάτω κουμπί για να ορίσεις νέο κωδικό. Θα αποσυνδεθούμε αυτόματα από όλες τις συσκευές σου μόλις ολοκληρωθεί η επαναφορά.',
    resetCta: '🔐 Ορισμός νέου κωδικού',
    resetDisclaimer: 'Ο σύνδεσμος λήγει σε 30 λεπτά. Αν δεν το ζήτησες εσύ, η ασφάλειά σου δεν επηρεάζεται.',
    resetFallback: 'Αν δεν έχεις την εφαρμογή, χρησιμοποίησε τον web σύνδεσμο:',

    adoptionTitle: 'Νέα εξέλιξη στην αίτησή σου',
    adoptionSubject: 'Ενημέρωση υιοθεσίας: {{pet}}',
    adoptionGreeting: 'Γεια σου <strong>{{username}}</strong>,',
    adoptionBody: 'Υπάρχει ενημέρωση στην αίτησή σου για τον/την <strong>{{pet}}</strong>.',
    adoptionCta: 'Δες την αίτησή σου',

    footerBrand: 'Pet-Match & Care · Διαχείριση αδέσποτων',
    footerContext: 'Λάβαμε αυτό το μήνυμα γιατί δημιούργησες λογαριασμό στην εφαρμογή μας.',
  },

  adoption: {
    stateLabels: {
      DRAFT: 'Πρόχειρο',
      SUBMITTED: 'Υποβλήθηκε',
      SCREENING: 'Αξιολόγηση',
      HOME_CHECK_SCHEDULED: 'Οικιακός έλεγχος',
      APPROVED: 'Εγκρίθηκε 🎉',
      REJECTED: 'Απορρίφθηκε',
      ADOPTION_COMPLETED: 'Ολοκληρώθηκε',
      CLOSED: 'Έκλεισε',
    },
  },
} as const;

export type ServerPane = typeof el;
