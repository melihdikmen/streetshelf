import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  makeMutable,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { styles } from './Skeleton.styles';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  /** A circle of `height` diameter, for avatars. */
  circle?: boolean;
}

/**
 * One clock for every skeleton on screen.
 *
 * A screen of placeholders can hold thirty blocks; giving each its own
 * repeating animation would run thirty timers on the UI thread and let the
 * sweeps drift out of step. Instead every block reads this single value, so
 * the whole screen shimmers as one sheet of light and costs one animation.
 * It runs only while at least one skeleton is mounted.
 */
const sweep = makeMutable(0);
let mounted = 0;

/** Starts the shared sweep when the first skeleton appears. */
function acquire(): void {
  mounted += 1;
  if (mounted === 1) {
    sweep.value = 0;
    sweep.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, false);
  }
}

/** Stops it when the last one goes. */
function release(): void {
  mounted = Math.max(0, mounted - 1);
  if (mounted === 0) cancelAnimation(sweep);
}

/** Highlight band colours: transparent, a soft white, transparent. */
const BAND = ['rgba(255,255,255,0)', 'rgba(255,255,255,0.65)', 'rgba(255,255,255,0)'] as const;

/**
 * Placeholder block with a light sweep passing over it. Screens compose
 * these into the shape of the content they are waiting for (see
 * `molecules/Skeletons.tsx`), so the layout does not jump when data lands.
 *
 * Honours the system "reduce motion" setting by showing a still block.
 */
export function Skeleton({ width = '100%', height, radius = 8, circle = false }: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const blockWidth = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    acquire();
    return release;
  }, [reduceMotion]);

  // Width is read on layout into a shared value, so measuring never
  // re-renders the component.
  const onLayout = (event: LayoutChangeEvent) => {
    blockWidth.value = event.nativeEvent.layout.width;
  };

  const bandStyle = useAnimatedStyle(() => {
    const w = blockWidth.value;
    return {
      width: Math.max(w * 0.6, 60),
      transform: [{ translateX: interpolate(sweep.value, [0, 1], [-Math.max(w * 0.6, 60), w]) }],
    };
  });

  const shape = circle
    ? { width: height, height, borderRadius: height / 2 }
    : { width, height, borderRadius: radius };

  return (
    <Animated.View style={[styles.base, shape]} onLayout={onLayout}>
      {reduceMotion ? null : (
        <Animated.View style={[styles.band, bandStyle]}>
          <LinearGradient colors={BAND} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.gradient} />
        </Animated.View>
      )}
    </Animated.View>
  );
}
