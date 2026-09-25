import { StyleSheet } from 'react-native';

import { spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  body: { paddingTop: spacing.xl, gap: spacing.xl },
  person: { alignItems: 'center', gap: spacing.md },
  centered: { textAlign: 'center' },
  stars: { alignItems: 'center' },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
