import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { styles } from './Skeleton.styles';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
}

/** Pulsing placeholder block for loading states. */
export function Skeleton({ width = '100%', height, radius = 8 }: SkeletonProps) {
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.base, { width, height, borderRadius: radius }, animated]} />;
}
