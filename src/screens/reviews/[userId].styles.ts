import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  average: { alignItems: 'center', gap: spacing.xs },
  bars: { flex: 1, gap: spacing.xs },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel: { width: 12, textAlign: 'right' },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasAlt,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.rent },
});
