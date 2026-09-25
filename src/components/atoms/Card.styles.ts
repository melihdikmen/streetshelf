import { StyleSheet } from 'react-native';

import { colors, radius, shadow, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  padded: { padding: spacing.lg },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
});
