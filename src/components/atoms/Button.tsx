import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';

import { colors } from '../../theme/tokens';
import { AppText } from './AppText';
import { styles } from './Button.styles';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';
type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
}

const labelTone: Record<ButtonVariant, 'onDark' | 'default' | 'accent' | 'danger'> = {
  primary: 'onDark',
  accent: 'onDark',
  secondary: 'default',
  ghost: 'accent',
  danger: 'danger',
};

const iconColor: Record<ButtonVariant, string> = {
  primary: colors.textOnDark,
  accent: colors.textOnDark,
  secondary: colors.text,
  ghost: colors.accentDark,
  danger: colors.danger,
};

/**
 * Tap target for every action. `primary` is ink (the 30 %), `accent` is the
 * leaf green reserved for the single most important action on a screen —
 * the one that lives in the thumb zone. Both clear 44 pt; `lg` clears 56.
 */
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled }}
      disabled={isDisabled}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor[variant]} />
      ) : (
        <View style={styles.content}>
          {icon ? <MaterialCommunityIcons name={icon} size={20} color={iconColor[variant]} /> : null}
          <AppText variant="bodyBold" tone={labelTone[variant]}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
