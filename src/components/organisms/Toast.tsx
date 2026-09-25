import { useEffect } from 'react';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '../../stores/session';
import { AppText } from '../atoms';
import { styles } from './Toast.styles';

/**
 * One-line confirmation that slides up from the bottom and leaves on its
 * own. Driven by `showToast` in the session store so any screen can use it.
 */
export function Toast() {
  const insets = useSafeAreaInsets();
  const toast = useSession((s) => s.toast);
  const clearToast = useSession((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const handle = setTimeout(clearToast, 2200);
    return () => clearTimeout(handle);
  }, [toast, clearToast]);

  if (!toast) return null;
  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(180)}
      pointerEvents="none"
      style={[styles.toast, { bottom: insets.bottom + 96 }]}
    >
      <AppText variant="captionBold" tone="onDark">
        {toast}
      </AppText>
    </Animated.View>
  );
}
