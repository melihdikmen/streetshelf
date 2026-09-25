import { Text, type TextProps } from 'react-native';

import { styles } from './AppText.styles';

export type TextVariant = 'display' | 'title' | 'body' | 'bodyBold' | 'caption' | 'captionBold';
export type TextTone = 'default' | 'muted' | 'subtle' | 'onDark' | 'accent' | 'danger';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
}

/**
 * The one text primitive. Four sizes, two weights, tones from the tokens —
 * no screen ever sets a fontFamily or fontSize itself.
 */
export function AppText({ variant = 'body', tone = 'default', style, ...rest }: AppTextProps) {
  return <Text {...rest} style={[styles.base, styles[variant], styles[`tone_${tone}`], style]} />;
}
