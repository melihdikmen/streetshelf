import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingBottom: spacing.sm,
    backgroundColor: colors.ink,
    alignItems: 'center',
  },
  barBack: { backgroundColor: colors.accent },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
