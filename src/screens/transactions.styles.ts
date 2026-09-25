import { StyleSheet } from 'react-native';

import { spacing } from '../theme/tokens';

export const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
});
