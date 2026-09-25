import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { colors } from '../../theme/tokens';
import { AppText } from './AppText';
import { styles } from './StarRating.styles';

export interface StarRatingProps {
  value: number;
  /** Makes the stars tappable. */
  onChange?: (value: number) => void;
  size?: number;
  /** Trailing "4.9 · 12" style label. */
  label?: string;
}

/** Five stars, read-only or interactive. Amber is reserved for this and RENT. */
export function StarRating({ value, onChange, size = 16, label }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star - 0.25;
        const half = !filled && value >= star - 0.75;
        const icon = filled ? 'star' : half ? 'star-half-full' : 'star-outline';
        const glyph = <MaterialCommunityIcons name={icon} size={size} color={filled || half ? colors.rent : colors.disabled} />;
        return onChange ? (
          <Pressable key={star} accessibilityRole="button" accessibilityLabel={String(star)} onPress={() => onChange(star)} hitSlop={6} style={styles.tap}>
            {glyph}
          </Pressable>
        ) : (
          <View key={star}>{glyph}</View>
        );
      })}
      {label ? (
        <AppText variant="captionBold" tone="muted" style={styles.label}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}
