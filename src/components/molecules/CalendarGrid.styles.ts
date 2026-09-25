import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  wrapper: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nav: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdays: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.xs,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    borderRadius: radius.md,
  },
  dayBlocked: { backgroundColor: colors.ink },
  dayBooked: { backgroundColor: colors.accentTint },
  dayToday: { borderWidth: 1.5, borderColor: colors.accent },
  past: { textDecorationLine: 'line-through' },
});
