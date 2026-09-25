import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.canvasAlt },
  body: { flex: 1, gap: 2 },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: { flex: 1 },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.canvasAlt,
  },
  unread: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.md,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
