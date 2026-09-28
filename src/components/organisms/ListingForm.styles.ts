import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  title: { paddingTop: spacing.sm, paddingBottom: spacing.lg },
  section: {
    gap: spacing.xs,
    marginBottom: spacing.xxl,
  },
  sectionBody: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  photoRow: { gap: spacing.md },
  addPhoto: {
    width: 104,
    height: 104,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  photo: {
    width: 104,
    height: 104,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.canvasAlt,
  },
  photoImage: { width: '100%', height: '100%' },
  coverTag: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhoto: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(23, 32, 26, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fields: {
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
  kindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  groupChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
