import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  codeText: { flex: 1, gap: 2 },
  code: { letterSpacing: 4 },
  codeActions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonAccent: { backgroundColor: colors.accent },
  sectionTitle: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridCell: { width: '48%' },
  gridRow: { width: '100%' },
  hidden: { display: 'none' },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  memberBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  memberName: { flex: 1 },
  leave: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
});
