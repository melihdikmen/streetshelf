import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useConnection } from '../../stores/connection';
import { colors } from '../../theme/tokens';
import { AppText } from '../atoms';
import { styles } from './OfflineBanner.styles';

type Phase = 'hidden' | 'offline' | 'back';

/** How long "back online" stays before the bar slides away. */
const BACK_ONLINE_MS = 2000;

/**
 * A bar across the top of every screen while there is no internet.
 *
 * It fills the status-bar area in ink, so the clock and battery switch to
 * white (the root layout flips the status bar style), and slides down under
 * the notch. When the connection returns it turns green for two seconds to
 * say so, then slides away. It never takes touches: the screen underneath
 * stays usable, and whatever is cached remains on screen.
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const offline = useConnection((s) => s.offline);
  const [phase, setPhase] = useState<Phase>('hidden');
  const wasOffline = useRef(false);

  useEffect(() => {
    if (offline) {
      wasOffline.current = true;
      setPhase('offline');
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    setPhase('back');
    const handle = setTimeout(() => setPhase('hidden'), BACK_ONLINE_MS);
    return () => clearTimeout(handle);
  }, [offline]);

  if (phase === 'hidden') return null;
  const back = phase === 'back';

  return (
    <Animated.View
      entering={SlideInUp.duration(250)}
      exiting={SlideOutUp.duration(250)}
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.bar, back && styles.barBack, { paddingTop: insets.top + 6 }]}
    >
      <View style={styles.row}>
        <MaterialCommunityIcons name={back ? 'wifi-check' : 'wifi-off'} size={16} color={colors.textOnDark} />
        <AppText variant="captionBold" tone="onDark">
          {back ? t('connection.back') : t('connection.offline')}
        </AppText>
      </View>
    </Animated.View>
  );
}
