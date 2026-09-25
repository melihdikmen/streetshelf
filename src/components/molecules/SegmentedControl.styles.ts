import { StyleSheet } from 'react-native';

import { colors, radius, shadow, spacing, touchTarget } from '../../theme/tokens';

export const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.canvasAlt,
    borderRadius: radius.pill,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: touchTarget.min - spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  segmentSelected: {
    backgroundColor: colors.surface,
    ...shadow.card,
  },
});
