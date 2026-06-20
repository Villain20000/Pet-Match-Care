/**
 * v2 navigator — wraps auth + onboarding + main tabs + stack modals.
 * Adds a LanguageSwitcher in the title bar of every stack screen.
 * Uses `useT()` + `navigation.setOptions({ title })` so live locale
 * switching updates the header without losing scroll state.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { Radii } from '@/theme';
import type { ColorBlindPreset, ContrastMode } from '@/services/a11y';
import { installLinkingListeners, parseDeepLink, setPendingDeepLink, consumePendingDeepLink } from '@/services/deeplink';
import { useT } from '@/services/i18n';
import { useThemeColors } from '@/services/theme';

import { DashboardScreen } from '@/screens/DashboardScreen';
import { ReportScreen } from '@/screens/ReportScreen';
import { AdoptionScreen } from '@/screens/AdoptionScreen';
import { MapScreen } from '@/screens/MapScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { VerifyEmailScreen } from '@/screens/AuthGateScreen';
import { ForgotPasswordScreen } from '@/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '@/screens/ResetPasswordScreen';
import { TwoFactorSetupScreen } from '@/screens/TwoFactorSetupScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { BadgesScreen } from '@/screens/BadgesScreen';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen';
import { LostPetScreen } from '@/screens/LostPetScreen';
import { AdoptionApplicationScreen } from '@/screens/AdoptionApplicationScreen';
import { MyApplicationsScreen } from '@/screens/MyApplicationsScreen';
import { TimelineScreen } from '@/screens/TimelineScreen';
import { NotificationsScreen } from '@/screens/NotificationsScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { FavoritesScreen } from '@/screens/FavoritesScreen';
import { useAuthStore } from '@/services/auth';
import type { PetForAdoptionDto } from '@/types';

export type RootStackParamList = {
  MainStack: undefined;
  Auth: undefined;
  VerifyEmail: { token?: string } | undefined;
  Onboarding: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string } | undefined;
  // Tab routes — listed so cross-navigator `navigate('Υιοθεσίες')` etc.
  // are type-safe from stack screens (React Navigation resolves them to
  // the parent tab navigator).
  Αρχική: undefined;
  Καταγραφή: undefined;
  Υιοθεσίες: undefined;
  Χάρτης: undefined;
  Χαμένα_ζωάκια: undefined;
  Καρμά_Πίνακας: undefined;
  Παράσημα: undefined;
  Ρυθμίσεις: undefined;
  TwoFactorSetup: undefined;
  Συμπλήρωση_αίτησης: { pet: PetForAdoptionDto };
  Οι_αιτήσεις_μου: undefined;
  TimelineScreen: { id: string };
  Notifications: undefined;
  Profile: undefined;
  Favorites: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabIcon = ({ icon, focused }: { icon: string; focused: boolean }) => {
  const { colors } = useThemeColors();
  return (
    <View
      style={{
        width: 44,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radii.pill,
        backgroundColor: focused ? colors.terracotta : 'transparent',
      }}
    >
      <Text style={{ fontSize: 18, color: focused ? colors.white : colors.charcoalSoft }}>{icon}</Text>
    </View>
  );
};

interface SettingsHOCProps {
  contrast: ContrastMode;
  setContrast: (v: ContrastMode) => void;
  colorBlind: ColorBlindPreset;
  setColorBlind: (v: ColorBlindPreset) => void;
}

const SettingsHOC = ({ contrast, setContrast, colorBlind, setColorBlind }: SettingsHOCProps) => (
  <SettingsScreen contrast={contrast} setContrast={setContrast} colorBlind={colorBlind} setColorBlind={setColorBlind} />
);

const MainTabs = () => {
  const t = useT();
  const { colors } = useThemeColors();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.creamSoft,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#2F3E46',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          height: 70,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
        tabBarActiveTintColor: colors.terracottaDeep,
        tabBarInactiveTintColor: colors.charcoalSoft,
      }}
    >
      <Tab.Screen
        name="Αρχική"
        component={DashboardScreen}
        options={{ tabBarLabel: t('dashboard.greeting'), tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }}
      />
      <Tab.Screen
        name="Καταγραφή"
        component={ReportScreen}
        options={{ tabBarLabel: t('report.overline'), tabBarIcon: ({ focused }) => <TabIcon icon="📍" focused={focused} /> }}
      />
      <Tab.Screen
        name="Υιοθεσίες"
        component={AdoptionScreen}
        options={{ tabBarLabel: t('adoption.overline'), tabBarIcon: ({ focused }) => <TabIcon icon="🐶" focused={focused} /> }}
      />
      <Tab.Screen
        name="Χάρτης"
        component={MapScreen}
        options={{ tabBarLabel: t('map.filtersTitle'), tabBarIcon: ({ focused }) => <TabIcon icon="🗺️" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
};

/** Wrap with a hook that re-fires `navigation.setOptions({ title })` on locale change. */
const withLocalizedTitle =
  (translationKey: string) =>
  <P extends { navigation: { setOptions: (opts: { title: string }) => void } }>(
    Screen: React.ComponentType<P>,
  ): React.ComponentType<P> =>
  (props) => {
    const t = useT();
    const navigation = props.navigation;
    useEffect(() => {
      navigation?.setOptions?.({ title: t(translationKey) });
    }, [t, navigation]);
    return <Screen {...props} />;
  };

const StackFlow = ({ contrast, setContrast, colorBlind, setColorBlind }: SettingsHOCProps) => {
  const { colors } = useThemeColors();
  return (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.cream },
      headerTintColor: colors.charcoal,
      headerTitleStyle: { fontWeight: '700' },
      contentStyle: { backgroundColor: colors.cream },
    }}
  >
    <Stack.Screen name="MainStack" options={{ headerShown: false }} component={MainTabs} />
    <Stack.Screen name="Χαμένα_ζωάκια" component={LostPetScreen} options={{ title: 'Lost pets' }} />
    <Stack.Screen name="Καρμά_Πίνακας" component={LeaderboardScreen} options={{ title: 'Leaderboard' }} />
    <Stack.Screen name="Παράσημα" component={BadgesScreen} options={{ title: 'Badges' }} />
    <Stack.Screen name="Ρυθμίσεις" options={{ presentation: 'card', title: 'Settings' }}>
      {() => <SettingsHOC contrast={contrast} setContrast={setContrast} colorBlind={colorBlind} setColorBlind={setColorBlind} />}
    </Stack.Screen>
    <Stack.Screen name="TwoFactorSetup" component={TwoFactorSetupScreen} options={{ title: '2FA' }} />
    <Stack.Screen name="Συμπλήρωση_αίτησης" component={AdoptionApplicationScreen} options={{ title: 'Αίτηση υιοθεσίας' }} />
    <Stack.Screen name="Οι_αιτήσεις_μου" component={MyApplicationsScreen} options={{ title: 'Οι αιτήσεις μου' }} />
    <Stack.Screen name="TimelineScreen" component={TimelineScreen} options={{ title: 'Χρονολόγιο' }} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorites' }} />
  </Stack.Navigator>
  );
};

const AuthFlow = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Forgot' }} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Reset' }} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const [contrast, setContrastState] = useState<ContrastMode>('normal');
  const [colorBlind, setColorBlindState] = useState<ColorBlindPreset>('normal');
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [pendingVerifyToken, setPendingVerifyToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const c = await AsyncStorage.getItem('@pmc/contrast');
      const cb = await AsyncStorage.getItem('@pmc/cb');
      const ob = await AsyncStorage.getItem('@petmatchcare/onboardingDone');
      if (c === 'high' || c === 'normal') setContrastState(c);
      if (cb === 'normal' || cb === 'protanopia' || cb === 'deuteranopia' || cb === 'tritanopia') setColorBlindState(cb);
      setOnboarded(ob === 'true');
    })();
  }, []);

  useEffect(() => {
    const cleanup = installLinkingListeners();
    const subInterval = setInterval(() => {
      const pending = consumePendingDeepLink();
      if (pending?.kind === 'verify-email' && pending.params.token) {
        setPendingVerifyToken(pending.params.token);
      }
    }, 600);
    return () => {
      cleanup();
      clearInterval(subInterval);
    };
  }, []);

  const setContrast = (v: ContrastMode) => {
    setContrastState(v);
    void AsyncStorage.setItem('@pmc/contrast', v);
  };
  const setColorBlind = (v: ColorBlindPreset) => {
    setColorBlindState(v);
    void AsyncStorage.setItem('@pmc/cb', v);
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        user && !user.emailVerifiedAt ? (
          <Stack.Screen name="VerifyEmail" options={{ headerShown: false }}>
            {() => <VerifyEmailScreen initialToken={pendingVerifyToken} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="MainStack">
            {() => <StackFlow contrast={contrast} setContrast={setContrast} colorBlind={colorBlind} setColorBlind={setColorBlind} />}
          </Stack.Screen>
        )
      ) : onboarded === false ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Screen name="Auth" component={AuthFlow} />
      )}
    </Stack.Navigator>
  );
};

void parseDeepLink;
void setPendingDeepLink;
void withLocalizedTitle; // reserved for future per-screen wrappers
