import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../../theme/tokens';
import type { Item, Message, Profile, Transaction } from '../../types/domain';

/** Statuses that have a system-line translation. */
const SYSTEM_KEYS = { ACCEPTED: true, REJECTED: true, CANCELLED: true, DELIVERED: true, RETURNED: true } as const;
import { formatMoney, formatShortDate, inclusiveDays } from '../../utils/format';
import { AppText, Button, ModeBadge } from '../atoms';
import { styles } from './TransactionCard.styles';

export interface TransactionCardProps {
  message: Message;
  transaction: Transaction;
  item: Item;
  me: Profile;
  other: Profile;
  onAccept?: (tx: Transaction) => void;
  onReject?: (tx: Transaction) => void;
  onCancel?: (tx: Transaction) => void;
  onPickupPhoto?: (tx: Transaction) => void;
  onReturnPhoto?: (tx: Transaction) => void;
  onReview?: (tx: Transaction) => void;
  reviewed?: boolean;
}

/**
 * The interactive widget embedded in a chat thread. One component renders
 * all four card kinds (REQUEST, SYSTEM, PICKUP_PHOTO, RETURN_PHOTO) from the
 * live transaction, so a card sent yesterday shows today's status.
 *
 * Who sees which button:
 *   * REQUEST, PENDING, I did not initiate → Accept / Decline.
 *   * REQUEST, PENDING, I initiated → "waiting" + Cancel.
 *   * ACCEPTED and I am the owner → "take handover photo".
 *   * DELIVERED and I am the owner, not a GIFT → "take return photo".
 */
export function TransactionCard({
  message,
  transaction: tx,
  item,
  me,
  other,
  onAccept,
  onReject,
  onCancel,
  onPickupPhoto,
  onReturnPhoto,
  onReview,
  reviewed = false,
}: TransactionCardProps) {
  const { t } = useTranslation();
  const iInitiated = tx.initiatedBy === me.id;
  const iAmOwner = tx.ownerId === me.id;
  const isGift = item.itemType === 'GIFT';
  const days = inclusiveDays(tx.startDate, tx.endDate);

  if (message.kind === 'SYSTEM') {
    const actor = message.senderId === me.id ? t('common.you') : other.displayName;
    // The server stamps the event's status into the body (migration 0007);
    // the live status is only a fallback for rows written before that.
    const stamped = message.body;
    const key: keyof typeof SYSTEM_KEYS =
      stamped && stamped in SYSTEM_KEYS
        ? (stamped as keyof typeof SYSTEM_KEYS)
        : tx.status === 'PENDING'
          ? 'ACCEPTED'
          : (tx.status as keyof typeof SYSTEM_KEYS);
    return (
      <View style={styles.systemRow}>
        <AppText variant="caption" tone="muted" style={styles.systemText}>
          {t(`tx.system.${key}`, { name: actor })}
        </AppText>
      </View>
    );
  }

  if (message.kind === 'PICKUP_PHOTO' || message.kind === 'RETURN_PHOTO') {
    const pickup = message.kind === 'PICKUP_PHOTO';
    return (
      <View style={styles.card}>
        <View style={styles.photoHeader}>
          <MaterialCommunityIcons name="camera-outline" size={18} color={colors.accentDark} />
          <AppText variant="captionBold" tone="accent">
            {pickup ? t('tx.pickupDone') : t('tx.returnDone')}
          </AppText>
        </View>
        {message.photoUrl ? (
          <Image source={{ uri: message.photoUrl }} style={styles.photo} contentFit="cover" />
        ) : null}
        <AppText variant="caption" tone="muted">
          {isGift ? t('tx.giftNoReturn') : t(`tx.status.${tx.status}`)}
        </AppText>
        {(tx.status === 'RETURNED' || (isGift && tx.status === 'DELIVERED')) && onReview ? (
          <Button
            label={reviewed ? t('review.reviewed') : t('review.cta')}
            variant={reviewed ? 'secondary' : 'primary'}
            icon={reviewed ? 'check' : 'star-outline'}
            fullWidth
            disabled={reviewed}
            onPress={() => onReview(tx)}
          />
        ) : null}
        {pickup && iAmOwner && !isGift && tx.status === 'DELIVERED' && onReturnPhoto ? (
          <Button
            label={t('tx.returnCta')}
            variant="accent"
            icon="camera"
            fullWidth
            onPress={() => onReturnPhoto(tx)}
          />
        ) : null}
      </View>
    );
  }

  // REQUEST card.
  const wanted = item.requestType === 'WANTED';
  const title = wanted
    ? iInitiated
      ? t('tx.offerTitleMine')
      : t('tx.offerTitle', { name: other.displayName })
    : iInitiated
      ? t('tx.requestTitleMine')
      : t('tx.requestTitle', { name: other.displayName });

  const dateLabel =
    tx.startDate === tx.endDate
      ? t('tx.oneDay', { start: formatShortDate(tx.startDate) })
      : t('tx.dates', { start: formatShortDate(tx.startDate), end: formatShortDate(tx.endDate) });

  return (
    <View style={styles.card}>
      <AppText variant="bodyBold">{title}</AppText>
      <View style={styles.itemRow}>
        {item.images[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.thumb} contentFit="cover" />
        ) : null}
        <View style={styles.itemBody}>
          <AppText variant="captionBold" numberOfLines={1}>
            {item.title}
          </AppText>
          <ModeBadge itemType={item.itemType} pricePerDay={item.pricePerDay} />
        </View>
      </View>
      <View style={styles.detailRow}>
        <MaterialCommunityIcons name="calendar-outline" size={16} color={colors.textMuted} />
        <AppText variant="caption" tone="muted">
          {dateLabel}
          {isGift ? '' : ` · ${t('tx.days', { count: days })}`}
        </AppText>
      </View>
      {item.itemType === 'RENT' ? (
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="cash" size={16} color={colors.textMuted} />
          <AppText variant="captionBold">
            {t('tx.total')}: {formatMoney(tx.totalAmount)}
          </AppText>
          <View style={styles.payChip}>
            <AppText variant="captionBold" style={styles.payChipText}>
              {t('tx.cash')}
            </AppText>
          </View>
        </View>
      ) : null}

      <View style={styles.statusRow}>
        <View style={[styles.statusDot, styles[`dot_${tx.status}`]]} />
        <AppText variant="captionBold" tone="muted">
          {t(`tx.status.${tx.status}`)}
        </AppText>
      </View>

      {tx.status === 'PENDING' && !iInitiated && onAccept && onReject ? (
        <View style={styles.actions}>
          <View style={styles.actionHalf}>
            <Button label={t('tx.reject')} variant="secondary" fullWidth onPress={() => onReject(tx)} />
          </View>
          <View style={styles.actionHalf}>
            <Button label={t('tx.accept')} variant="accent" fullWidth onPress={() => onAccept(tx)} />
          </View>
        </View>
      ) : null}

      {tx.status === 'PENDING' && iInitiated && onCancel ? (
        <View style={styles.actions}>
          <View style={styles.actionHalf}>
            <AppText variant="caption" tone="subtle">
              {t('tx.waiting')}
            </AppText>
          </View>
          <Button label={t('tx.cancel')} variant="ghost" onPress={() => onCancel(tx)} />
        </View>
      ) : null}

      {tx.status === 'ACCEPTED' && iAmOwner && onPickupPhoto ? (
        <Button
          label={t('tx.pickupCta')}
          variant="accent"
          icon="camera"
          fullWidth
          onPress={() => onPickupPhoto(tx)}
        />
      ) : null}
    </View>
  );
}
