import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { colors } from '../../theme/tokens';
import { AppText } from './AppText';
import { styles } from './ListRow.styles';

export interface ListRowProps {
  icon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  hint?: string;
  value?: string;
  onPress?: () => void;
  /** Replaces the chevron, e.g. a Switch. */
  trailing?: ReactNode;
  danger?: boolean;
}

/** Settings-style row: icon, label, optional value, chevron or custom trailing. */
export function ListRow({ icon, label, hint, value, onPress, trailing, danger }: ListRowProps) {
  const tone = danger ? 'danger' : 'default';
  const iconColor = danger ? colors.danger : colors.textMuted;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={22} color={iconColor} /> : null}
      <View style={styles.text}>
        <AppText tone={tone}>{label}</AppText>
        {hint ? (
          <AppText variant="caption" tone="subtle">
            {hint}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="caption" tone="muted">
          {value}
        </AppText>
      ) : null}
      {trailing ??
        (onPress ? (
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSubtle} />
        ) : null)}
    </Pressable>
  );
}
