import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

import { colors } from '../../theme/tokens';
import { AppText, Button } from '../atoms';
import { styles } from './Celebration.styles';

export interface CelebrationProps {
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Extra content between the copy and the buttons, e.g. an invite code. */
  children?: React.ReactNode;
}

/**
 * The peak moment. A check that springs in, a title with room to breathe,
 * and the next step under the thumb. Used after publishing, sending a
 * request and creating a group so the three feel like one family.
 */
export function Celebration({
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  children,
}: CelebrationProps) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 9, stiffness: 140 });
    opacity.value = withTiming(1, { duration: 250 });
    glow.value = withDelay(150, withTiming(1, { duration: 500 }));
  }, [glow, opacity, scale]);

  const badge = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  const halo = useAnimatedStyle(() => ({
    opacity: glow.value * 0.6,
    transform: [{ scale: 1 + glow.value * 0.6 }],
  }));

  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <View style={styles.badgeWrap}>
          <Animated.View style={[styles.halo, halo]} />
          <Animated.View style={[styles.badge, badge]}>
            <MaterialCommunityIcons name="check-bold" size={44} color={colors.textOnDark} />
          </Animated.View>
        </View>
        <AppText variant="display" style={styles.centered}>
          {title}
        </AppText>
        <AppText tone="muted" style={styles.centered}>
          {body}
        </AppText>
        {children}
      </View>
      <View style={styles.actions}>
        <Button label={primaryLabel} variant="accent" size="lg" fullWidth onPress={onPrimary} />
        {secondaryLabel && onSecondary ? (
          <Button label={secondaryLabel} variant="ghost" onPress={onSecondary} />
        ) : null}
      </View>
    </View>
  );
}
