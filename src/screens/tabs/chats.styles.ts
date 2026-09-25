import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  list: { paddingBottom: spacing.xxxl },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 48 + spacing.md,
  },
});
