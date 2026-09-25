import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import i18n from '../../i18n';
import { colors } from '../../theme/tokens';
import { AppText } from '../atoms';
import { toIsoDay } from './DayPicker';
import { styles } from './CalendarGrid.styles';

export interface CalendarGridProps {
  /** Days the owner blocked. */
  blocked: string[];
  /** Days held by an accepted transaction; shown but not toggleable. */
  booked?: string[];
  onToggle: (iso: string) => void;
}

/**
 * One month at a time, Monday first. Past days are inert, booked days are
 * marked and locked, blocked days are toggled with a tap. Used by the
 * owner's availability screen.
 */
export function CalendarGrid({ blocked, booked = [], onToggle }: CalendarGridProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-GB';
  const today = toIsoDay(new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7;
  const cells: (number | null)[] = [...Array<null>(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' }),
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setCursor(new Date(year, month - 1, 1))} style={styles.nav}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="bodyBold">{cursor.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</AppText>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setCursor(new Date(year, month + 1, 1))} style={styles.nav}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.weekdays}>
        {weekdays.map((label, i) => (
          <AppText key={i} variant="caption" tone="subtle" style={styles.weekday}>
            {label}
          </AppText>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (day === null) return <View key={`e-${index}`} style={styles.cell} />;
          const iso = toIsoDay(new Date(year, month, day));
          const past = iso < today;
          const isBooked = booked.includes(iso);
          const isBlocked = blocked.includes(iso);
          return (
            <Pressable
              key={iso}
              accessibilityRole="button"
              accessibilityState={{ selected: isBlocked, disabled: past || isBooked }}
              disabled={past || isBooked}
              onPress={() => onToggle(iso)}
              style={[styles.cell, styles.day, isBlocked && styles.dayBlocked, isBooked && styles.dayBooked, iso === today && styles.dayToday]}
            >
              <AppText
                variant={isBlocked || isBooked ? 'captionBold' : 'caption'}
                tone={past ? 'subtle' : isBlocked ? 'onDark' : isBooked ? 'accent' : 'default'}
                style={past && styles.past}
              >
                {day}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
