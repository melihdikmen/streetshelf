import { StyleSheet } from 'react-native';

import { colors, radius, spacing, touchTarget } from '../theme/tokens';

export const styles = StyleSheet.create({
  body: {
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  reasons: { gap: spacing.sm },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTarget.min + 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonSelected: { borderColor: colors.accent },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touchTarget.min,
  },
});
