import 'react-native-gesture-handler';
import './global.css';

import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { View, ActivityIndicator, Text } from 'react-native';

import { AppNavigator } from '@/navigation/AppNavigator';
import { ToastHost } from '@/components/ToastHost';
import { initNotifications, registerPushToken } from '@/services/notifications';
import { useAuthStore } from '@/services/auth';
import { queryClient, queryPersister } from '@/services/queries';
import { api, getStoredBundle } from '@/services/api';
import { installLinkingListeners } from '@/services/deeplink';
import { linkingConfig } from '@/navigation/LinkingConfig';
import { installLanguageInterceptor, useI18nStore } from '@/services/i18n';
import { installAutoToastErrorInterceptor } from '@/services/toast';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* module might not be installed on older Expo SDK */
});

const BootGate = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        installLinkingListeners();
        installLanguageInterceptor();
        installAutoToastErrorInterceptor(api);
        await useI18nStore.getState().hydrate();

        await getStoredBundle();
        const token = useAuthStore.getState().token;
        if (token) {
          await useAuthStore.getState().hydrate();
          await registerPushToken(token);
        }
        await initNotifications();
      } finally {
        setReady(true);
        SplashScreen.hideAsync().catch(() => undefined);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F1DE' }}>
        <ActivityIndicator color="#E07A5F" />
        <Text style={{ marginTop: 12, color: '#2F3E46' }}>Φόρτωση…</Text>
      </View>
    );
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: queryPersister, maxAge: 1000 * 60 * 60 * 24 }}
        >
          <BootGate>
            <NavigationContainer linking={linkingConfig}>
              <AppNavigator />
              <StatusBar style="dark" />
              <ToastHost />
            </NavigationContainer>
          </BootGate>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
