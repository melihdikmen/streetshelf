import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  card: { flex: 1 },
  imageWrap: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.canvasAlt,
  },
  image: { width: '100%', height: '100%' },
  imageReserved: { opacity: 0.45 },
  reservedPill: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
  badge: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
  },
  groupPill: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(23, 32, 26, 0.72)',
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaLabel: { flex: 1 },
  distance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  wantedRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  wantedIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wantedBody: {
    flex: 1,
    gap: spacing.sm,
  },
});
