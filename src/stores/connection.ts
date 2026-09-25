import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { create } from 'zustand';

import { DEV_OFFLINE } from '../dev/route';

/**
 * Whether the device can reach the internet, for the offline bar.
 *
 * Kept apart from the session store: it changes on its own schedule, and
 * only the bar and the status bar style need it, so nothing else re-renders
 * when Wi-Fi drops.
 */
interface ConnectionState {
  offline: boolean;
  /** Starts listening; returns the unsubscribe. Call once, from the root layout. */
  watch: () => () => void;
}

/**
 * Going offline must last this long before it is shown. Switching from Wi-Fi
 * to mobile data, or a lift between floors, often drops the link for a moment;
 * flashing a bar for that is noise. Coming back online is shown at once.
 */
const OFFLINE_GRACE_MS = 1000;

/**
 * No link at all, or a link that NetInfo has checked and found without
 * internet (a captive portal, a router with no uplink). An unknown
 * reachability (`null`, before the first check) counts as online.
 */
function isOffline(state: NetInfoState): boolean {
  return state.isConnected === false || state.isInternetReachable === false;
}

export const useConnection = create<ConnectionState>((set) => ({
  offline: false,

  watch: () => {
    if (__DEV__ && DEV_OFFLINE) {
      set({ offline: true });
      return () => undefined;
    }
    let pending: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = NetInfo.addEventListener((state) => {
      clearTimeout(pending);
      if (isOffline(state)) {
        pending = setTimeout(() => set({ offline: true }), OFFLINE_GRACE_MS);
      } else {
        set({ offline: false });
      }
    });
    return () => {
      clearTimeout(pending);
      unsubscribe();
    };
  },
}));
