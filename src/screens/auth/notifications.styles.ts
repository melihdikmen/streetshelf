import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  body: {
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  // The same rings as the location step, so the two read as one sequence.
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
  reasons: {
    gap: spacing.sm,
  },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reasonIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonText: { flex: 1 },
  footer: { gap: spacing.xs },
});
