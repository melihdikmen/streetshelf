import { StyleSheet } from 'react-native';

import { colors, type } from '../../theme/tokens';

export const styles = StyleSheet.create({
  base: {
    fontFamily: type.family.regular,
    color: colors.text,
  },
  display: {
    fontFamily: type.family.bold,
    fontSize: type.size.xl,
    lineHeight: type.lineHeight.xl,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: type.family.bold,
    fontSize: type.size.lg,
    lineHeight: type.lineHeight.lg,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: type.size.md,
    lineHeight: type.lineHeight.md,
  },
  bodyBold: {
    fontFamily: type.family.bold,
    fontSize: type.size.md,
    lineHeight: type.lineHeight.md,
  },
  caption: {
    fontSize: type.size.sm,
    lineHeight: type.lineHeight.sm,
  },
  captionBold: {
    fontFamily: type.family.bold,
    fontSize: type.size.sm,
    lineHeight: type.lineHeight.sm,
  },
  tone_default: { color: colors.text },
  tone_muted: { color: colors.textMuted },
  tone_subtle: { color: colors.textSubtle },
  tone_onDark: { color: colors.textOnDark },
  tone_accent: { color: colors.accentDark },
  tone_danger: { color: colors.danger },
});
