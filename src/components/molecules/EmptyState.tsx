import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { colors } from '../../theme/tokens';
import { AppText, Button } from '../atoms';
import { styles } from './EmptyState.styles';

export interface EmptyStateProps {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  body: string;
  ctaLabel?: string;
  onCta?: () => void;
}

/**
 * An empty list is an invitation, not a dead end: icon, one line of why,
 * one line of what to do, and the button that does it.
 */
export function EmptyState({ icon, title, body, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={36} color={colors.accentDark} />
      </View>
      <AppText variant="title" style={styles.centered}>
        {title}
      </AppText>
      <AppText variant="body" tone="muted" style={styles.centered}>
        {body}
      </AppText>
      {ctaLabel && onCta ? <Button label={ctaLabel} variant="accent" onPress={onCta} /> : null}
    </View>
  );
}
