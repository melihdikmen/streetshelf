import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  camera: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  preview: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: 'rgba(23, 32, 26, 0.55)',
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2, paddingTop: spacing.sm },
  hint: { opacity: 0.8 },
  controls: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    backgroundColor: 'rgba(23, 32, 26, 0.55)',
  },
  sideButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    borderWidth: 4,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  actions: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: 'rgba(23, 32, 26, 0.7)',
  },
  actionGrow: { flex: 1 },
  permission: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  centered: { textAlign: 'center' },
});
