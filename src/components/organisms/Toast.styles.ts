import { StyleSheet } from 'react-native';

import { colors, radius, shadow, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    ...shadow.floating,
  },
});
