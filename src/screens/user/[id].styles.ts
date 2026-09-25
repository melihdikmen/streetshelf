import { StyleSheet } from 'react-native';

import { spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionTitle: { marginTop: spacing.xl, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridCell: { width: '48%' },
  reviews: { gap: spacing.md },
});
