import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  base: {
    minHeight: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  pressed: { opacity: 0.8 },
});
