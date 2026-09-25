import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { colors } from '../../theme/tokens';
import { AppText } from '../atoms';
import { styles } from './OptionCard.styles';

export interface OptionCardProps {
  glyph: string;
  title: string;
  hint: string;
  selected: boolean;
  onPress: () => void;
  /** Tint behind the glyph; defaults to the accent tint. */
  tint?: string;
}

/**
 * Tappable choice with an emoji, a title and one line of explanation — the
 * create flow uses these instead of radio buttons so each mode gets its
 * own colour and personality.
 */
export function OptionCard({ glyph, title, hint, selected, onPress, tint }: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.base, selected && styles.selected, pressed && styles.pressed]}
    >
      <View style={[styles.glyphWrap, { backgroundColor: tint ?? colors.accentTint }]}>
        <AppText variant="title">{glyph}</AppText>
      </View>
      <View style={styles.text}>
        <AppText variant="bodyBold">{title}</AppText>
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      </View>
      <MaterialCommunityIcons
        name={selected ? 'check-circle' : 'circle-outline'}
        size={24}
        color={selected ? colors.accent : colors.disabled}
      />
    </Pressable>
  );
}
