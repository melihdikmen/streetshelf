import { StyleSheet } from 'react-native';

import { colors, spacing } from '../theme/tokens';

export const styles = StyleSheet.create({
  list: { paddingVertical: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  name: { flex: 1 },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg + 44 + spacing.md },
  skeleton: { paddingHorizontal: spacing.lg },
});
