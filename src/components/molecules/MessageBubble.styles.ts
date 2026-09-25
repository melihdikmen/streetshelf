import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs,
  },
  rowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    gap: spacing.xs,
  },
  bubbleMine: {
    backgroundColor: colors.ink,
    borderBottomRightRadius: radius.sm,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.sm,
  },
  time: {
    alignSelf: 'flex-end',
    opacity: 0.7,
  },
});
