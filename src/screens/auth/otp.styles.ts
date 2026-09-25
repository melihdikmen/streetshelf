import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  body: {
    paddingTop: spacing.xl,
    gap: spacing.lg,
    alignItems: 'flex-start',
  },
  boxes: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
  box: {
    flex: 1,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: colors.accent },
  hidden: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
});
