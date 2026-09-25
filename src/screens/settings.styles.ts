import { StyleSheet } from 'react-native';

import { spacing } from '../theme/tokens';

export const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 0.8,
    paddingHorizontal: spacing.xs,
  },
  danger: {
    marginTop: spacing.xxl,
    gap: spacing.xs,
    alignItems: 'center',
  },
});
