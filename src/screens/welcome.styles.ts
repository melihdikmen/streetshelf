import { StyleSheet } from 'react-native';

import { colors, radius, shadow, spacing } from '../theme/tokens';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.xl,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadow.floating,
  },
  title: { marginBottom: spacing.xs },
  tagline: { color: colors.textMuted },
  body: { maxWidth: 320 },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  pillLend: { backgroundColor: colors.lendTint },
  pillRent: { backgroundColor: colors.rentTint },
  pillGift: { backgroundColor: colors.giftTint },
  pillLendText: { color: colors.lend },
  pillRentText: { color: colors.rent },
  pillGiftText: { color: colors.gift },
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  legal: { textAlign: 'center', paddingHorizontal: spacing.lg },
});
