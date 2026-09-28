import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { EmptyState, Screen, SegmentedControl, TransactionListSkeleton, TransactionRow } from '../src/components';
import { styles } from '../src/screens/transactions.styles';
import { useSession } from '../src/stores/session';

const ACTIVE = new Set(['PENDING', 'ACCEPTED', 'DELIVERED']);

/** Everything I am giving or receiving, ongoing first. */
export default function TransactionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const userId = useSession((s) => s.userId);
  const transactions = useSession((s) => s.transactions);
  const conversations = useSession((s) => s.conversations);
  const itemCache = useSession((s) => s.itemCache);
  const profiles = useSession((s) => s.profiles);
  const reviewed = useSession((s) => s.reviewedTransactionIds);
  const loadTransactions = useSession((s) => s.loadTransactions);
  const loadConversations = useSession((s) => s.loadConversations);
  const showError = useSession((s) => s.showError);
  const loaded = useSession((s) => s.loaded.transactions);
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      await Promise.all([loadTransactions(), loadConversations()]);
    } catch (error) {
      showError(error);
    }
  }, [loadConversations, loadTransactions, showError]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const rows = useMemo(
    () =>
      transactions
        .filter((tx) => (tab === 'active' ? ACTIVE.has(tx.status) : !ACTIVE.has(tx.status)))
        .map((tx) => {
          const item = itemCache[tx.itemId];
          const otherId = tx.ownerId === userId ? tx.borrowerId : tx.ownerId;
          const other = profiles[otherId];
          if (!item || !other) return null;
          const conversation = conversations.find((c) => c.item.id === tx.itemId && c.other.id === otherId);
          const conversationId = conversation?.id;
          // Built here, with the row, so each handler keeps its identity until
          // the row's data changes and the memoised TransactionRow can skip.
          return {
            tx,
            item,
            other,
            mine: tx.ownerId === userId,
            open: () => conversationId && router.push({ pathname: '/chat/[id]', params: { id: conversationId } }),
            review: () => router.push({ pathname: '/review/[transactionId]', params: { transactionId: tx.id } }),
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null),
    [conversations, itemCache, profiles, router, tab, transactions, userId],
  );

  const renderRow = useCallback(
    ({ item: row }: { item: (typeof rows)[number] }) => (
      <TransactionRow
        transaction={row.tx}
        item={row.item}
        other={row.other}
        mine={row.mine}
        onPress={row.open}
        reviewed={reviewed.includes(row.tx.id)}
        onReview={row.review}
      />
    ),
    [reviewed],
  );

  return (
    <Screen padded={false} edges={['left', 'right']}>
      <View style={styles.header}>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          segments={[
            { value: 'active', label: t('transactions.active') },
            { value: 'past', label: t('transactions.past') },
          ]}
        />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.tx.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refresh();
              setRefreshing(false);
            }}
          />
        }
        renderItem={renderRow}
        ListEmptyComponent={
          loaded ? (
            <EmptyState icon="swap-horizontal" title={t('transactions.empty')} body={t('transactions.emptyBody')} />
          ) : (
            <TransactionListSkeleton />
          )
        }
      />
    </Screen>
  );
}
