import { Pressable, View } from 'react-native';

import { AppText } from '../atoms';
import { styles } from './SegmentedControl.styles';

export interface Segment<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Two-or-three way switch; the OFFER / WANTED toggle on Discover. The
 * selected pill is white on the canvas-alt track, so it reads as raised.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(segment.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <AppText variant="captionBold" tone={selected ? 'default' : 'muted'}>
              {segment.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
