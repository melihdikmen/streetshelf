import {
  AuthorizationStatus,
  deleteToken,
  getMessaging,
  getToken,
  hasPermission,
  onTokenRefresh,
  type RemoteMessage,
  requestPermission,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Push runs on Firebase Messaging (the Vouch setup), with FCM delivering to
 * both platforms; the APNs key lives in Firebase. Not `expo-notifications`:
 * both want to own the APNs delegate on iOS and together neither works.
 *
 * `undetermined` and `denied` stay apart because they need opposite handling:
 * one is worth asking about, the other cannot be asked again (iOS shows its
 * prompt once per install). `unavailable` is a build or device that cannot
 * answer at all (no Firebase config, no Play services).
 */
export type PushPermission = 'granted' | 'denied' | 'undetermined' | 'unavailable';

/** Android 13 made notifications a runtime permission; below it, installing grants them. */
const ANDROID_RUNTIME_PERMISSION_SDK = 33;

/**
 * Whether this Android asks about notifications at all. Firebase's
 * `requestPermission` only knows iOS: on Android it reports success without
 * asking, which leaves a valid token whose notifications the system drops.
 */
function needsAndroidPermission(): boolean {
  return Platform.OS === 'android' && Number(Platform.Version) >= ANDROID_RUNTIME_PERMISSION_SDK;
}

/** Firebase's status as the app's answer; provisional (quiet delivery) counts as granted. */
function toPermission(status: number): PushPermission {
  if (status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL) return 'granted';
  return status === AuthorizationStatus.NOT_DETERMINED ? 'undetermined' : 'denied';
}

/** The current permission, without prompting (Settings must not spend the one iOS prompt). */
export async function getPushPermission(): Promise<PushPermission> {
  try {
    if (needsAndroidPermission()) {
      // `check` cannot tell "never asked" from "refused", and Android allows
      // asking again, so anything but granted is still worth asking about.
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      return granted ? 'granted' : 'undetermined';
    }
    return toPermission(await hasPermission(getMessaging()));
  } catch {
    return 'unavailable';
  }
}

/** Shows the system prompt. Called only when being notified has just become useful. */
async function requestPushPermission(): Promise<PushPermission> {
  try {
    if (needsAndroidPermission()) {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
      return result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? 'denied' : 'undetermined';
    }
    return toPermission(await requestPermission(getMessaging()));
  } catch {
    return 'unavailable';
  }
}

/**
 * This device's FCM token, asking for permission first when `ask` is true and
 * nobody has been asked yet. Null when notifications are off or unavailable.
 */
export async function devicePushToken(ask: boolean): Promise<string | null> {
  const current = await getPushPermission();
  const permission = current === 'undetermined' && ask ? await requestPushPermission() : current;
  if (permission !== 'granted') return null;
  try {
    const token = await getToken(getMessaging());
    // The token is what a test send from the Firebase console needs, and
    // there is no other way to read it.
    if (__DEV__) console.log('[push] token', token);
    return token || null;
  } catch {
    return null;
  }
}

/**
 * Kills this install's FCM token after sign-out, so a stale server-side copy
 * can never reach the phone again. The next registration gets a fresh one.
 */
export async function forgetDeviceToken(): Promise<void> {
  try {
    await deleteToken(getMessaging());
  } catch {
    // Best effort: signing out must work offline.
  }
}

/**
 * Calls `listener` whenever Firebase rotates this device's token (reinstall,
 * restore, or on its own); an unsaved rotation silently stops delivery.
 *
 * @returns The unsubscribe.
 */
export function watchTokenRefresh(listener: (token: string) => void): () => void {
  try {
    return onTokenRefresh(getMessaging(), listener);
  } catch {
    return () => undefined;
  }
}

/** The route a notification opens (`send-push` puts it in `data.url`), if any. */
export function notificationUrl(message: RemoteMessage | null): string | null {
  const url = message?.data?.url;
  return typeof url === 'string' && url.startsWith('/') ? url : null;
}

/**
 * The chat thread on screen right now, as the route a push would open. A
 * module value rather than store state: it changes on every navigation and
 * nothing re-renders for it.
 */
let openThreadUrl: string | null = null;

/** Called by the chat screen on focus and blur. */
export function setOpenThread(conversationId: string | null): void {
  openThreadUrl = conversationId ? `/chat/${conversationId}` : null;
}

/** Whether a notification is about the thread already on screen (its message is in the list). */
export function isAboutOpenThread(message: RemoteMessage): boolean {
  return notificationUrl(message) === openThreadUrl;
}
