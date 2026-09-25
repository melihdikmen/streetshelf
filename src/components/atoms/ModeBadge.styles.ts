import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  bg_GIFT: { backgroundColor: colors.giftTint },
  bg_LEND: { backgroundColor: colors.lendTint },
  bg_RENT: { backgroundColor: colors.rentTint },
  text_GIFT: { color: colors.gift },
  text_LEND: { color: colors.lend },
  text_RENT: { color: colors.rent },
});
