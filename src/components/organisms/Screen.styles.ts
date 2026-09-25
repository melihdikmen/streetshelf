import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  flex: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg },
  scrollContent: { paddingBottom: spacing.xxxl },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
