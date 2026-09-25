import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  body: { paddingTop: spacing.lg, gap: spacing.lg },
  legend: { flexDirection: 'row', gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: { width: 14, height: 14, borderRadius: radius.sm },
  swatchFree: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  swatchBlocked: { backgroundColor: colors.ink },
  swatchBooked: { backgroundColor: colors.accentTint },
});
