import { TextInput, type TextInputProps, View } from 'react-native';

import { colors } from '../../theme/tokens';
import { AppText } from './AppText';
import { styles } from './Field.styles';

export interface FieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  /** Text shown inside the field before the value, e.g. a currency sign. */
  prefix?: string;
}

/**
 * Labelled text input. Multiline fields grow to a comfortable height and
 * keep the label above the box so the layout does not jump.
 */
export function Field({ label, hint, error, prefix, multiline, style, ...rest }: FieldProps) {
  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="captionBold" tone="muted">
          {label}
        </AppText>
      ) : null}
      <View style={[styles.box, multiline && styles.boxMultiline, !!error && styles.boxError]}>
        {prefix ? (
          <AppText variant="bodyBold" tone="muted">
            {prefix}
          </AppText>
        ) : null}
        <TextInput
          placeholderTextColor={colors.textSubtle}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...rest}
          style={[styles.input, multiline && styles.inputMultiline, style]}
        />
      </View>
      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="subtle">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
