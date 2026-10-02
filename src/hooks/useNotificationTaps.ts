import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
} from '@react-native-firebase/messaging';
import { type Href, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { isAboutOpenThread, notificationUrl } from '../services/notifications';
import { useSession } from '../stores/session';

/**
 * Connects push notifications to the running app:
 *
 * - a tap opens the thread it is about, whether it launched the app or
 *   brought it back from the background;
 * - one arriving while the app is open shows as the in-app toast instead
 *   (FCM does not display notifications in the foreground), except for the
 *   thread already on screen, where the message is in the list.
 *
 * Waits until the app is ready and someone is signed in, so the auth guard
 * does not immediately send the user back to Welcome.
 */
export function useNotificationTaps(ready: boolean): void {
  const router = useRouter();
  const signedIn = useSession((s) => s.userId !== null);
  const showToast = useSession((s) => s.showToast);

  useEffect(() => {
    if (!ready || !signedIn) return;
    let messaging: ReturnType<typeof getMessaging>;
    try {
      messaging = getMessaging();
    } catch {
      // A build without Firebase config: no push, nothing to listen to.
      return;
    }
    let active = true;
    const open = (url: string | null) => {
      if (active && url) router.push(url as Href);
    };

    void getInitialNotification(messaging)
      .then((message) => open(notificationUrl(message)))
      .catch(() => undefined);
    const offOpened = onNotificationOpenedApp(messaging, (message) => open(notificationUrl(message)));
    const offMessage = onMessage(messaging, (message) => {
      const { title, body } = message.notification ?? {};
      if (!body || isAboutOpenThread(message)) return;
      showToast(title ? `${title}: ${body}` : body);
    });

    return () => {
      active = false;
      offOpened();
      offMessage();
    };
  }, [ready, router, showToast, signedIn]);
}
