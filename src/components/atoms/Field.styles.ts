import { StyleSheet } from 'react-native';

import { colors, radius, spacing, touchTarget, type } from '../../theme/tokens';

export const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTarget.min + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boxMultiline: {
    minHeight: 120,
    paddingVertical: spacing.md,
    alignItems: 'flex-start',
  },
  boxError: { borderColor: colors.danger },
  input: {
    flex: 1,
    fontFamily: type.family.regular,
    fontSize: type.size.md,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  inputMultiline: { paddingVertical: 0 },
});
