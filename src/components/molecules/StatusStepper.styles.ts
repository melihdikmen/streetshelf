import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: spacing.xs },
  line: {
    width: '100%',
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    position: 'absolute',
    left: 0,
    right: '50%',
    top: 9,
    height: 2,
    backgroundColor: colors.border,
  },
  connectorDone: { backgroundColor: colors.accent },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  dotFailed: { backgroundColor: colors.danger, borderColor: colors.danger },
  label: { textAlign: 'center' },
});
