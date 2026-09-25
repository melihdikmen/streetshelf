import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  body: {
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  itemCard: { marginBottom: spacing.sm },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemText: { flex: 1, gap: 2 },
  quick: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: -spacing.sm,
  },
  summary: { gap: spacing.md },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  holdNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentTint,
  },
  holdNoteText: { flex: 1 },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
});
