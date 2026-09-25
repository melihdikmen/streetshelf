import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  badgeWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  halo: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.accentTint,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: { textAlign: 'center' },
  actions: { gap: spacing.xs },
});
