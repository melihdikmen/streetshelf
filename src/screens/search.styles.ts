import { StyleSheet } from 'react-native';

import { colors, radius, spacing, touchTarget, type } from '../theme/tokens';

export const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  back: {
    width: touchTarget.min,
    height: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTarget.min + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontFamily: type.family.regular,
    fontSize: type.size.md,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  suggestions: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touchTarget.min,
  },
  popularTitle: { marginTop: spacing.lg },
  popular: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  column: { gap: spacing.md },
  count: { marginBottom: spacing.xs },
});
