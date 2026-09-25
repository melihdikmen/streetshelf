import { StyleSheet } from 'react-native';

import { colors } from '../../theme/tokens';

export const styles = StyleSheet.create({
  image: { backgroundColor: colors.canvasAlt },
  fallback: {
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
