import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../src/i18n';
import { AnimatedSplash, Toast } from '../src/components';
import { useSession } from '../src/stores/session';
import { DevRouteJumper } from '../src/dev/DevRouteJumper';
import { colors, type as typography } from '../src/theme/tokens';

// Hold the native splash until the font is in; the first frame would
// otherwise render in the system face and then jump.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden.
});

// No native cross-fade: the JS splash underneath is pixel-identical, so an
// instant swap is invisible, while a fade would briefly show both.
SplashScreen.setOptions({ fade: false });

/** Routes a signed-out user may be on. */
const PUBLIC_SEGMENTS = new Set(['welcome', 'auth']);

/**
 * Sends the user back to Welcome whenever the session disappears while they
 * are inside the app: an expired or revoked refresh token, sign-out on
 * another device, a wiped local database. Without this the tabs stay on
 * screen, signed out and silently empty.
 */
function useAuthGuard(ready: boolean): void {
  const router = useRouter();
  const segments = useSegments();
  const userId = useSession((s) => s.userId);
  const first = segments[0];

  useEffect(() => {
    if (!ready || userId) return;
    if (first === undefined || PUBLIC_SEGMENTS.has(first)) return;
    if (router.canDismiss()) router.dismissAll();
    router.replace('/welcome');
  }, [first, ready, router, userId]);
}

export default function RootLayout() {
  const { t } = useTranslation();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_700Bold,
  });
  const authReady = useSession((s) => s.authReady);
  const bootstrap = useSession((s) => s.bootstrap);
  const ready = (fontsLoaded || fontError !== null) && authReady;

  // Reads the persisted session and loads the signed-in user's basics; the
  // returned cleanup drops the auth listener.
  useEffect(() => bootstrap(), [bootstrap]);

  const [splashDone, setSplashDone] = useState(false);
  // Lifting the native splash is the overlay's call: it asks from its own
  // onLayout, once an identical picture is already on screen.
  const hideNativeSplash = useCallback(() => {
    void SplashScreen.hideAsync();
  }, []);
  const finishSplash = useCallback(() => setSplashDone(true), []);

  useAuthGuard(ready);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.canvas },
            headerShadowVisible: false,
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: typography.family.bold, fontSize: typography.size.lg },
            contentStyle: { backgroundColor: colors.canvas },
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="auth/email" options={{ title: '' }} />
          <Stack.Screen name="auth/otp" options={{ title: '' }} />
          <Stack.Screen name="auth/profile" options={{ title: '', headerBackVisible: false, gestureEnabled: false }} />
          <Stack.Screen name="auth/location" options={{ title: '' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="item/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ title: '' }} />
          <Stack.Screen name="search" options={{ headerShown: false }} />
          <Stack.Screen name="transactions" options={{ title: t('transactions.title') }} />
          <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
          <Stack.Screen name="group/[id]" options={{ title: '' }} />
          <Stack.Screen name="user/[id]" options={{ title: '' }} />
          <Stack.Screen name="reviews/[userId]" options={{ title: t('review.listTitle') }} />
          <Stack.Screen name="availability/[itemId]" options={{ title: t('availability.title') }} />
          <Stack.Screen name="review/[transactionId]" options={{ title: t('review.title'), presentation: 'modal' }} />
          {/* Sheets: quick interruptions of whatever the user was looking at. */}
          <Stack.Screen name="request/[itemId]" options={{ title: t('request.title'), presentation: 'modal' }} />
          <Stack.Screen name="group/join" options={{ title: t('group.joinTitle'), presentation: 'modal' }} />
          <Stack.Screen name="group/create" options={{ title: t('groupMore.createTitle'), presentation: 'modal' }} />
          <Stack.Screen name="report" options={{ title: t('report.title'), presentation: 'modal' }} />
          <Stack.Screen name="camera" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        </Stack>
        <Toast />
        {splashDone ? null : <AnimatedSplash onReady={hideNativeSplash} onFinish={finishSplash} />}
        {__DEV__ ? <DevRouteJumper /> : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
