/**
 * React Navigation linking configuration. We map both the `petmatchcare://`
 * scheme paths AND the https://app.petmatchcare.gr web fallbacks, so the
 * same email magic-link works whether the user taps it from a mail
 * client (handled by Android intentFilters in app.json → includes the
 * app's MainActivity) or from a desktop browser.
 */
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './AppNavigator';

export const linkingConfig: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'petmatchcare://',
    'https://app.petmatchcare.gr',
    'https://www.petmatchcare.gr',
  ],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          ForgotPassword: 'forgot',
          ResetPassword: 'reset-password',
        },
      },
      MainStack: {
        screens: {
          Main: {
            screens: {
              Αρχική: 'home',
              Καταγραφή: 'report',
              Υιοθεσίες: 'adoption',
              Χάρτης: 'map',
            },
          },
          Χαμένα_ζωάκια: 'lost-pets',
          Καρμά_Πίνακας: 'leaderboard',
          Παράσημα: 'badges',
          Ρυθμίσεις: 'settings',
          TwoFactorSetup: '2fa',
          Συμπλήρωση_αίτησης: 'apply/:petId',
          Οι_αιτήσεις_μου: 'applications',
          TimelineScreen: 'timeline/:id',
          Notifications: 'notifications',
        },
      },
      VerifyEmail: 'verify-email',
      Onboarding: 'onboarding',
    },
  },
};
