import { StyleSheet } from 'react-native';

import { colors } from '../../theme/tokens';

export const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.canvasAlt,
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  gradient: { flex: 1 },
});
