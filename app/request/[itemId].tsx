import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Celebration,
  Chip,
  DayPicker,
  Field,
  ModeBadge,
  Screen,
  dayFromToday,
  expandRange,
} from '../../src/components';
import { colors } from '../../src/theme/tokens';
import { styles } from '../../src/screens/request/[itemId].styles';
import { useSession } from '../../src/stores/session';
import { formatMoney, formatShortDate, inclusiveDays } from '../../src/utils/format';

/** Saturday and Sunday of this week, or next week's if the weekend has passed. */
function weekend(): [string, string] {
  const today = new Date();
  const day = today.getDay();
  const toSaturday = day === 0 ? 6 : 6 - day;
  return [dayFromToday(toSaturday), dayFromToday(toSaturday + 1)];
}

/**
 * Request sheet. Dates first (quick chips for the three common answers),
 * an optional note, a summary that totals RENT, and the send button. On
 * success the sheet turns into the celebration and hands off to chat.
 */
export default function RequestScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const createRequest = useSession((s) => s.createRequest);
  const transactions = useSession((s) => s.transactions);
  const item = useSession((s) => s.itemCache[itemId]);
  const loadUnavailable = useSession((s) => s.loadUnavailable);
  const showError = useSession((s) => s.showError);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadUnavailable(itemId).catch(() => undefined);
  }, [itemId, loadUnavailable]);

  // Owner-closed days plus any of the caller's own accepted handovers. Other
  // people's bookings are private; the RPC re-checks them on send.
  const disabledDays = useMemo(() => {
    if (!item) return [];
    const held = transactions
      .filter((tx) => tx.itemId === item.id && (tx.status === 'ACCEPTED' || tx.status === 'DELIVERED'))
      .flatMap((tx) => expandRange(tx.startDate, tx.endDate));
    return [...item.unavailableDates, ...held];
  }, [item, transactions]);

  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (!item) return null;

  const isGift = item.itemType === 'GIFT';
  const wanted = item.requestType === 'WANTED';
  const days = start && end ? inclusiveDays(start, end) : 0;
  const total = (item.pricePerDay ?? 0) * days;
  const isRent = item.itemType === 'RENT';

  const send = async () => {
    if (!start || !end) return;
    setSending(true);
    try {
      setSentTo(await createRequest(item, start, end, note));
    } catch (error) {
      showError(error);
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <Screen padded={false} edges={['left', 'right', 'bottom']}>
        <Celebration
          title={t('request.sentTitle')}
          body={t('request.sentBody', { name: item.owner.displayName })}
          primaryLabel={t('request.openChat')}
          onPrimary={() => router.replace({ pathname: '/chat/[id]', params: { id: sentTo } })}
          secondaryLabel={t('common.done')}
          onSecondary={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      edges={['left', 'right']}
      footer={
        <Button
          label={wanted ? t('request.sendWanted') : t('request.send')}
          variant="accent"
          size="lg"
          fullWidth
          loading={sending}
          disabled={!start || !end}
          onPress={send}
        />
      }
    >
      <View style={styles.body}>
        <Card style={styles.itemCard} padded>
          <View style={styles.itemRow}>
            <View style={styles.itemText}>
              <AppText variant="bodyBold" numberOfLines={2}>
                {item.title}
              </AppText>
              <AppText variant="caption" tone="muted">
                {item.owner.displayName}
              </AppText>
            </View>
            <ModeBadge itemType={item.itemType} pricePerDay={item.pricePerDay} />
          </View>
        </Card>

        <AppText variant="bodyBold">{isGift ? t('request.pickupDay') : t('request.when')}</AppText>
        <View style={styles.quick}>
          <Chip label={t('request.quickToday')} selected={start === dayFromToday(0) && end === dayFromToday(0)} onPress={() => { setStart(dayFromToday(0)); setEnd(dayFromToday(0)); }} />
          <Chip label={t('request.quickTomorrow')} selected={start === dayFromToday(1) && end === dayFromToday(1)} onPress={() => { setStart(dayFromToday(1)); setEnd(dayFromToday(1)); }} />
          {!isGift ? (
            <Chip label={t('request.quickWeekend')} selected={start === weekend()[0] && end === weekend()[1]} onPress={() => { const [s, e] = weekend(); setStart(s); setEnd(e); }} />
          ) : null}
        </View>
        <DayPicker
          start={start}
          end={end}
          disabled={disabledDays}
          single={isGift}
          onChange={(s, e) => {
            setStart(s);
            setEnd(e);
          }}
        />

        <Field
          label={t('request.messageLabel')}
          placeholder={t('request.messagePlaceholder')}
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={300}
        />

        {start && end ? (
          <Card style={styles.summary}>
            <AppText variant="captionBold" tone="muted">
              {t('request.summary')}
            </AppText>
            <View style={styles.summaryRow}>
              <AppText tone="muted">{isGift ? t('request.pickupDay') : t('request.when')}</AppText>
              <AppText variant="bodyBold">
                {start === end
                  ? formatShortDate(start)
                  : `${formatShortDate(start)} – ${formatShortDate(end)}`}
              </AppText>
            </View>
            {!isGift ? (
              <View style={styles.summaryRow}>
                <AppText tone="muted">{t('tx.days', { count: days })}</AppText>
                {item.itemType === 'RENT' ? (
                  <AppText variant="bodyBold">
                    {days} × {formatMoney(item.pricePerDay ?? 0)}
                  </AppText>
                ) : (
                  <AppText variant="bodyBold" tone="accent">
                    {t('common.free')}
                  </AppText>
                )}
              </View>
            ) : null}
            {item.itemType === 'RENT' ? (
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <AppText variant="bodyBold">{t('tx.total')}</AppText>
                <AppText variant="title">{formatMoney(total)}</AppText>
              </View>
            ) : null}
          </Card>
        ) : null}

        {isRent ? (
          <View style={styles.holdNote}>
            <MaterialCommunityIcons name="hand-coin-outline" size={16} color={colors.accentDark} />
            <AppText variant="caption" tone="accent" style={styles.holdNoteText}>
              {t('request.cashNote')}
            </AppText>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
