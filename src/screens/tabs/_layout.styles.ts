import { StyleSheet } from 'react-native';

import { colors, radius, shadow } from '../../theme/tokens';

export const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 84,
    paddingTop: 8,
  },
  createButton: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    ...shadow.floating,
  },
  badge: {
    backgroundColor: colors.accent,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
  },
});
