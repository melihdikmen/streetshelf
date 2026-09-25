import { Redirect } from 'expo-router';

import { useSession } from '../src/stores/session';

/**
 * Entry gate. Waits for the persisted session to be read, then sends a new
 * user to onboarding, a half-onboarded one back to the profile step, and a
 * returning one to the tabs. The native splash is still up while it waits.
 */
export default function Index() {
  const authReady = useSession((s) => s.authReady);
  const userId = useSession((s) => s.userId);
  const onboarded = useSession((s) => s.onboarded);
  if (!authReady) return null;
  if (!userId) return <Redirect href="/welcome" />;
  return <Redirect href={onboarded ? '/(tabs)' : '/auth/profile'} />;
}
