import { memo } from 'react';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Item, Profile, Transaction } from '../../types/domain';
import { formatMoney, formatShortDate } from '../../utils/format';
import { AppText, Avatar, Button, Card, ModeBadge } from '../atoms';
import { StatusStepper } from './StatusStepper';
import { styles } from './TransactionRow.styles';

export interface TransactionRowProps {
  transaction: Transaction;
  item: Item;
  other: Profile;
  mine: boolean;
  onPress: () => void;
  onReview?: () => void;
  reviewed?: boolean;
}

/** One transaction in "My activity": item, the other person, dates, stepper. *
 * Memoised: pass stable callbacks (built once per row) or it redraws anyway.
 */
export const TransactionRow = memo(function TransactionRow({ transaction: tx, item, other, mine, onPress, onReview, reviewed = false }: TransactionRowProps) {
  const { t } = useTranslation();
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.top}>
        {item.images[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <AppText variant="title">🙋</AppText>
          </View>
        )}
        <View style={styles.body}>
          <AppText variant="captionBold" tone="accent">
            {mine ? t('transactions.lending') : t('transactions.borrowing')}
          </AppText>
          <AppText variant="bodyBold" numberOfLines={1}>
            {item.title}
          </AppText>
          <View style={styles.meta}>
            <Avatar name={other.displayName} uri={other.avatarUrl} size={18} />
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {other.displayName} · {formatShortDate(tx.startDate)}
              {tx.endDate !== tx.startDate ? ` – ${formatShortDate(tx.endDate)}` : ''}
            </AppText>
          </View>
        </View>
        <View style={styles.right}>
          <ModeBadge itemType={item.itemType} pricePerDay={item.pricePerDay} />
          {item.itemType === 'RENT' ? (
            <AppText variant="captionBold">{formatMoney(tx.totalAmount)}</AppText>
          ) : null}
        </View>
      </View>
      <StatusStepper status={tx.status} itemType={item.itemType} />
      {onReview && (tx.status === 'RETURNED' || (item.itemType === 'GIFT' && tx.status === 'DELIVERED')) ? (
        <Button
          label={reviewed ? t('review.reviewed') : t('review.cta')}
          variant={reviewed ? 'secondary' : 'primary'}
          icon={reviewed ? 'check' : 'star-outline'}
          disabled={reviewed}
          onPress={onReview}
        />
      ) : null}
    </Card>
  );
});
