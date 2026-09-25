import { StyleSheet } from 'react-native';

import { spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  heroText: { flex: 1 },
  settings: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  stat: { alignItems: 'center', gap: 2 },
  links: { marginBottom: spacing.xl },
  sectionTitle: { marginBottom: spacing.md },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridCell: { width: '48%' },
  gridRow: { width: '100%' },
  signOut: { marginTop: spacing.xxl, alignItems: 'center' },
});
