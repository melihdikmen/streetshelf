import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  body: {
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  illustration: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring3: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: radius.pill,
    backgroundColor: colors.accentTint,
    opacity: 0.5,
  },
  ring2: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: radius.pill,
    backgroundColor: colors.accentTint,
  },
  ring1: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusLabel: { marginTop: spacing.sm },
  radii: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  radiusOption: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  footer: { gap: spacing.xs },
});
