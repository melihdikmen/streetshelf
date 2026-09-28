import { StyleSheet } from 'react-native';

import { colors, radius, spacing, touchTarget, type } from '../../theme/tokens';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  hidden: { display: 'none' },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemThumb: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.canvasAlt,
  },
  itemText: { flex: 1, gap: spacing.xs },
  list: {
    paddingVertical: spacing.md,
  },
});
