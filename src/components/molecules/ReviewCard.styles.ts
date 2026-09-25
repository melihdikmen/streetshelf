import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  card: { gap: spacing.md },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headText: { flex: 1, gap: 2 },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.accentTint,
  },
});
