import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  title: { paddingTop: spacing.sm, paddingBottom: spacing.lg },
  list: { gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 2 },
  code: { alignItems: 'flex-end' },
  codeText: { letterSpacing: 2 },
  footer: { gap: spacing.xs },
});
