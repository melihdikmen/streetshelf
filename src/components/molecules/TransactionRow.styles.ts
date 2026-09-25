import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  top: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.canvasAlt,
  },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  right: { alignItems: 'flex-end', gap: spacing.xs },
});
