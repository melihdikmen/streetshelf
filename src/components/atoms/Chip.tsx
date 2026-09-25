import { Pressable } from 'react-native';

import { AppText } from './AppText';
import { styles } from './Chip.styles';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Optional leading glyph, e.g. an emoji. */
  leading?: string;
}

/**
 * Filter chip. Selected state flips to ink so the active filter is the
 * darkest thing in the row.
 */
export function Chip({ label, selected = false, onPress, leading }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.base, selected && styles.selected, pressed && styles.pressed]}
    >
      <AppText variant="captionBold" tone={selected ? 'onDark' : 'default'}>
        {leading ? `${leading} ${label}` : label}
      </AppText>
    </Pressable>
  );
}
