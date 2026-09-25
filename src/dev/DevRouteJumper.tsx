import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useSession } from '../stores/session';
import { DEV_EMAIL, DEV_ROUTE } from './route';

/** The local Mailpit API sits next to the local Supabase API (54521 → 54524). */
function mailpitBase(): string | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  return url && /:54521$/.test(url) ? url.replace(/:54521$/, ':54524') : null;
}

/**
 * Reads the newest sign-in code sent to an address from Mailpit, retrying
 * briefly while the mail is in flight.
 */
async function readCode(email: string): Promise<string> {
  const base = mailpitBase();
  if (!base) throw new Error('DEV_EMAIL needs the local stack');
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const search = await fetch(`${base}/api/v1/search?limit=1&query=${encodeURIComponent(`to:"${email}"`)}`);
    const id = ((await search.json()) as { messages?: { ID: string }[] }).messages?.[0]?.ID;
    if (!id) continue;
    const message = (await (await fetch(`${base}/api/v1/message/${id}`)).json()) as { Text?: string };
    const code = message.Text?.match(/\b(\d{6})\b/)?.[1];
    if (code) return code;
  }
  throw new Error('No code arrived');
}

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
    void sendOtp(email)
      .then(() => readCode(email))
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
