import { Pressable, ScrollView, View } from 'react-native';

import i18n from '../../i18n';
import { AppText } from '../atoms';
import { styles } from './DayPicker.styles';

export interface DayPickerProps {
  /** `YYYY-MM-DD` */
  start: string | null;
  end: string | null;
  /** Single day only (GIFT): tapping sets both start and end. */
  single?: boolean;
  onChange: (start: string, end: string) => void;
  daysAhead?: number;
  /** Days that cannot be picked (owner blocked or already booked). */
  disabled?: string[];
}

/** `YYYY-MM-DD` for a date, in local time. */
export function toIsoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Every day from `start` to `end` inclusive, as `YYYY-MM-DD` in local time. */
export function expandRange(start: string, end: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  while (cursor <= last) {
    days.push(toIsoDay(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** The date `offset` days from today as `YYYY-MM-DD`. */
export function dayFromToday(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toIsoDay(date);
}

/**
 * Horizontal strip of the next two weeks. First tap sets the start, second
 * tap the end; a tap before the start restarts the range. Faster than a
 * calendar for a request that is almost always "this weekend".
 */
export function DayPicker({ start, end, single = false, onChange, daysAhead = 14, disabled = [] }: DayPickerProps) {
  const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-GB';
  const days = Array.from({ length: daysAhead }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      iso: toIsoDay(date),
      weekday: date.toLocaleDateString(locale, { weekday: 'short' }),
      day: date.getDate(),
      weekend: date.getDay() === 0 || date.getDay() === 6,
    };
  });

  const select = (iso: string) => {
    if (single || !start || (start && end && start !== end) || iso < start) {
      onChange(iso, iso);
      return;
    }
    // A range may not jump over a blocked day.
    const blockedInside = disabled.some((d) => d > start && d <= iso);
    if (blockedInside) {
      onChange(iso, iso);
      return;
    }
    onChange(start, iso);
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {days.map((d) => {
        const inRange = !!start && !!end && d.iso >= start && d.iso <= end;
        const isEdge = d.iso === start || d.iso === end;
        const isDisabled = disabled.includes(d.iso);
        return (
          <Pressable
            key={d.iso}
            accessibilityRole="button"
            accessibilityState={{ selected: inRange, disabled: isDisabled }}
            disabled={isDisabled}
            onPress={() => select(d.iso)}
            style={[styles.day, inRange && styles.dayInRange, isEdge && styles.dayEdge, isDisabled && styles.dayDisabled]}
          >
            <AppText variant="caption" tone={isEdge ? 'onDark' : isDisabled ? 'subtle' : d.weekend ? 'accent' : 'subtle'}>
              {d.weekday}
            </AppText>
            <AppText variant="bodyBold" tone={isEdge ? 'onDark' : isDisabled ? 'subtle' : 'default'} style={isDisabled && styles.dayDisabledText}>
              {d.day}
            </AppText>
          </Pressable>
        );
      })}
      <View style={styles.tail} />
    </ScrollView>
  );
}
