import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText, Button, CalendarGrid, Screen, expandRange } from '../../src/components';
import { styles } from '../../src/screens/availability/[itemId].styles';
import { useSession } from '../../src/stores/session';

/** Owner blocks days on a month grid; accepted bookings show as locked. */
export default function AvailabilityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const item = useSession((s) => s.itemCache[itemId]);
  const saved = useSession((s) => s.unavailable[itemId]);
  const transactions = useSession((s) => s.transactions);
  const loadUnavailable = useSession((s) => s.loadUnavailable);
  const loadTransactions = useSession((s) => s.loadTransactions);
  const setUnavailableDates = useSession((s) => s.setUnavailableDates);
  const showToast = useSession((s) => s.showToast);
  const showError = useSession((s) => s.showError);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const seeded = useRef(false);

  useEffect(() => {
    void Promise.all([loadUnavailable(itemId), loadTransactions()]).catch(showError);
  }, [itemId, loadTransactions, loadUnavailable, showError]);

  // Take the server's days once, then let the user's taps own the state.
  useEffect(() => {
    if (saved && !seeded.current) {
      seeded.current = true;
      setBlocked(saved);
    }
  }, [saved]);

  const booked = useMemo(
    () => transactions.filter((tx) => tx.itemId === itemId && (tx.status === 'ACCEPTED' || tx.status === 'DELIVERED')).flatMap((tx) => expandRange(tx.startDate, tx.endDate)),
    [transactions, itemId],
  );

  if (!item) return null;

  const save = async () => {
    setSaving(true);
    try {
      await setUnavailableDates(item.id, blocked);
      showToast(t('availability.saved'));
      router.back();
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll edges={['left', 'right']} footer={<Button label={t('availability.save')} variant="accent" size="lg" fullWidth loading={saving} onPress={save} />}>
      <View style={styles.body}>
        <AppText variant="bodyBold">{item.title}</AppText>
        <AppText tone="muted">{t('availability.body')}</AppText>
        <CalendarGrid blocked={blocked} booked={booked} onToggle={(iso) => setBlocked((prev) => (prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso]))} />
        <View style={styles.legend}>
          <Legend swatch={styles.swatchFree} label={t('availability.free')} />
          <Legend swatch={styles.swatchBlocked} label={t('availability.blocked')} />
          <Legend swatch={styles.swatchBooked} label={t('availability.booked')} />
        </View>
      </View>
    </Screen>
  );
}

/** Colour swatch plus label for the calendar legend. */
function Legend({ swatch, label }: { swatch: object; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, swatch]} />
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}
