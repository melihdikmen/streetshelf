import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  centered: { textAlign: 'center' },
});
