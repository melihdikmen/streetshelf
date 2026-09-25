import { StyleSheet } from 'react-native';

import { colors, spacing, touchTarget } from '../../theme/tokens';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touchTarget.min + 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.canvasAlt },
  text: { flex: 1, gap: 2 },
});
