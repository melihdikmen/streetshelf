import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  body: {
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  avatarWrap: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  avatarPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    backgroundColor: colors.accentTint,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
