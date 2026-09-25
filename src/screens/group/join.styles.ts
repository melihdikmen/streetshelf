import { StyleSheet } from 'react-native';

import { colors, radius, spacing, type } from '../../theme/tokens';

export const styles = StyleSheet.create({
  body: {
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  codeInput: {
    fontFamily: type.family.bold,
    fontSize: type.size.xl,
    letterSpacing: 6,
    textAlign: 'center',
  },
  success: {
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.xxxl,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: { textAlign: 'center' },
});
