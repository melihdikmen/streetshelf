import { StyleSheet } from 'react-native';

import { colors, radius, spacing, touchTarget } from '../../theme/tokens';

export const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  size_md: { minHeight: touchTarget.min },
  size_lg: { minHeight: touchTarget.primary },
  fullWidth: { alignSelf: 'stretch' },
  primary: { backgroundColor: colors.ink },
  accent: { backgroundColor: colors.accent },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.dangerTint },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
});
