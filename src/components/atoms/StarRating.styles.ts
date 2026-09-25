import { StyleSheet } from 'react-native';

import { spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  tap: { padding: spacing.xs },
  label: { marginLeft: spacing.xs },
});
