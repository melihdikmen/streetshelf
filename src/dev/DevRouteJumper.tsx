import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useSession } from '../stores/session';
import { readCode } from './mailpit';
import { DEV_EMAIL, DEV_ROUTE } from './route';

/**
 * Applies the shortcuts in `route.ts`: signs in with a seeded email when set,
 * then jumps to `DEV_ROUTE`. Renders nothing; mounted in dev builds only.
 */
export function DevRouteJumper() {
  const router = useRouter();
  const authReady = useSession((s) => s.authReady);
  const userId = useSession((s) => s.userId);
  const verifyOtp = useSession((s) => s.verifyOtp);
  const sendOtp = useSession((s) => s.sendOtp);

  useEffect(() => {
    if (!__DEV__ || !DEV_EMAIL || !authReady || userId) return;
    const email = DEV_EMAIL;
    const since = Date.now();
    void sendOtp(email)
      .then(() => readCode(email, since))
      .then((code) => verifyOtp(email, code))
      .then(({ onboarded }) => router.replace(onboarded ? '/(tabs)' : '/auth/profile'))
      .catch(() => undefined);
  }, [authReady, router, sendOtp, userId, verifyOtp]);

  useEffect(() => {
    if (!__DEV__ || !DEV_ROUTE || !authReady) return;
    const handle = setTimeout(() => router.replace(DEV_ROUTE as never), 300);
    return () => clearTimeout(handle);
  }, [authReady, router, userId]);
  return null;
}
