import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  strip: { gap: spacing.sm, paddingRight: spacing.lg },
  day: {
    width: 56,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayInRange: {
    backgroundColor: colors.accentTint,
    borderColor: colors.accentTint,
  },
  dayEdge: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  dayDisabled: {
    backgroundColor: colors.canvasAlt,
    borderColor: colors.canvasAlt,
  },
  dayDisabledText: { textDecorationLine: 'line-through' },
  tail: { width: spacing.lg },
});
