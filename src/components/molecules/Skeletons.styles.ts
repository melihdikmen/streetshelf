import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../theme/tokens';

/** Paddings and gaps copied from the real components so the swap is seamless. */
export const styles = StyleSheet.create({
  photo: { width: '100%' },
  cardBody: { padding: spacing.md, gap: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stack: { gap: spacing.md },
  flexGap: { flex: 1, gap: spacing.sm },
  wantedRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txCard: { gap: spacing.lg },
  txTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepper: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { flex: 1, alignItems: 'center', gap: spacing.xs },
  groupCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  reviewCard: { gap: spacing.md },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  profileCentered: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md },
  profileTextCentered: { alignItems: 'center', gap: spacing.sm },
  detailBody: { padding: spacing.lg, gap: spacing.lg },
  detailBadges: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chat: { paddingVertical: spacing.md, gap: spacing.md },
  bubbleLeft: { paddingHorizontal: spacing.lg, alignItems: 'flex-start' },
  bubbleRight: { paddingHorizontal: spacing.lg, alignItems: 'flex-end' },
  chatCard: { paddingHorizontal: spacing.lg },
});
