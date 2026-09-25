import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../../theme/tokens';
import { AppText } from '../atoms';
import { MARK_SIZE, styles } from './AnimatedSplash.styles';

export interface AnimatedSplashProps {
  /** Called once this overlay is on screen, so the native splash can be lifted. */
  onReady: () => void;
  /** Called when the exit animation is done; unmount the overlay then. */
  onFinish: () => void;
}

/**
 * Takes over from the native splash and hands off to the app.
 *
 * It first renders exactly what the native splash shows (the same mark, the
 * same size, dead centre on the same canvas) and only then asks for the native
 * one to be hidden, so the swap is invisible. Then the wordmark rises in under
 * the mark, holds for a beat, and the whole overlay fades while the mark grows
 * a little, revealing the first screen that has been rendering underneath.
 *
 * About 0.9 s end to end. Everything runs on the UI thread through Reanimated;
 * the JS thread is free to load the first screen's data meanwhile.
 */
export function AnimatedSplash({ onReady, onFinish }: AnimatedSplashProps) {
  const word = useSharedValue(0);
  const exit = useSharedValue(0);

  const start = useCallback(() => {
    onReady();
    word.value = withDelay(80, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
    exit.value = withDelay(
      620,
      withSequence(
        withTiming(1, { duration: 280, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (finished) runOnJS(onFinish)();
        }),
      ),
    );
  }, [exit, onFinish, onReady, word]);

  // A safety net: if layout never fires (it always should), do not trap the
  // user behind the splash.
  useEffect(() => {
    const handle = setTimeout(onFinish, 3000);
    return () => clearTimeout(handle);
  }, [onFinish]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: 1 - exit.value }));
  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + exit.value * 0.12 }] }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: (1 - word.value) * 8 }],
  }));

  return (
    <Animated.View style={[styles.root, rootStyle]} pointerEvents="none" onLayout={start}>
      <View style={styles.center}>
        <Animated.View style={[styles.mark, markStyle]}>
          <MaterialCommunityIcons name="home-heart" size={Math.round((MARK_SIZE * 40) / 72)} color={colors.textOnDark} />
        </Animated.View>
      </View>
      <Animated.View style={[styles.wordmark, wordStyle]}>
        <AppText variant="title">NeighborLend</AppText>
      </Animated.View>
    </Animated.View>
  );
}
