import { StyleSheet } from 'react-native';

import { colors, spacing, touchTarget } from '../../theme/tokens';

export const styles = StyleSheet.create({
  body: {
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touchTarget.primary,
    padding: spacing.md,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pressed: { backgroundColor: colors.canvasAlt },
  text: { flex: 1, gap: 2 },
});
