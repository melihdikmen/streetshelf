import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  body: {
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  codeBox: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accent,
  },
  code: { letterSpacing: 6 },
});
