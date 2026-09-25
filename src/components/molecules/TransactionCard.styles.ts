import { StyleSheet } from 'react-native';

import { colors, radius, shadow, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.canvasAlt,
  },
  itemBody: { flex: 1, gap: spacing.xs },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dot_PENDING: { backgroundColor: colors.rent },
  dot_ACCEPTED: { backgroundColor: colors.accent },
  dot_REJECTED: { backgroundColor: colors.danger },
  dot_DELIVERED: { backgroundColor: colors.lend },
  dot_RETURNED: { backgroundColor: colors.accentDark },
  dot_CANCELLED: { backgroundColor: colors.textSubtle },
  payChip: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.rentTint,
  },
  payChipText: { color: colors.rent },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionHalf: { flex: 1 },
  systemRow: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    marginVertical: spacing.sm,
  },
  systemText: { textAlign: 'center' },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    backgroundColor: colors.canvasAlt,
  },
});
