import { Pressable, type PressableProps, View, type ViewProps } from 'react-native';

import { styles } from './Card.styles';

export interface CardProps extends ViewProps {
  onPress?: PressableProps['onPress'];
  padded?: boolean;
}

/**
 * White surface on the canvas with the soft tinted shadow. Becomes a
 * Pressable when given `onPress`.
 */
export function Card({ onPress, padded = true, style, children, ...rest }: CardProps) {
  const composed = [styles.base, padded && styles.padded, style];
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [composed, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View {...rest} style={composed}>
      {children}
    </View>
  );
}
