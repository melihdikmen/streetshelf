import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { AppText, Avatar, Card, EmptyState, ItemCard, ItemGridSkeleton, ListRow, Screen, StarRating } from '../../src/components';
import { useGridCellWidth } from '../../src/hooks/useGridCellWidth';
import { styles } from '../../src/screens/tabs/profile.styles';
import { useSession } from '../../src/stores/session';
import type { Item } from '../../src/types/domain';
import { colors } from '../../src/theme/tokens';

/** Who I am, what I have shared, and the doors to activity and settings. */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const me = useSession((s) => s.me);
  const allMyItems = useSession((s) => s.myItems);
  const myItems = useMemo(() => allMyItems.filter((i) => i.status !== 'ARCHIVED'), [allMyItems]);
  const myStats = useSession((s) => s.myStats);
  const itemsLoaded = useSession((s) => s.loaded.myItems);
  const cellWidth = useGridCellWidth();
  // One callback for every card, so the memoised ItemCard is not redrawn on
  // each render just because it received a new arrow function.
  const openItem = useCallback((item: Item) => router.push({ pathname: '/item/[id]', params: { id: item.id } }), [router]);
  const groupCount = useSession((s) => s.groups.length);
  const loadMyItems = useSession((s) => s.loadMyItems);
  const loadProfile = useSession((s) => s.loadProfile);
  const loadTransactions = useSession((s) => s.loadTransactions);
  const showError = useSession((s) => s.showError);
  // Only matters before the first successful load: without it a failed first
  // load (offline launch) would leave the skeleton on screen forever.
  const [failed, setFailed] = useState(false);

  /** Reloads listings, stats and activity; `isCurrent` drops a late answer after blur. */
  const load = useCallback(
    (isCurrent: () => boolean = () => true) => {
      if (!me.id) return;
      setFailed(false);
      Promise.all([loadMyItems(), loadProfile(me.id), loadTransactions()]).catch((error: unknown) => {
        if (!isCurrent()) return;
        setFailed(true);
        showError(error);
      });
    },
    [loadMyItems, loadProfile, loadTransactions, me.id, showError],
  );
  const retry = useCallback(() => load(), [load]);
  const openCreate = useCallback(() => router.push('/(tabs)/create'), [router]);

  // Own listings, stats and activity count change from other screens (a new
  // listing, a finished handover), so this reloads each time it is shown.
  useFocusEffect(
    useCallback(() => {
      let current = true;
      load(() => current);
      return () => {
        current = false;
      };
    }, [load]),
  );
  const activeCount = useSession(
    (s) => s.transactions.filter((tx) => ['PENDING', 'ACCEPTED', 'DELIVERED'].includes(tx.status)).length,
  );

  const stats = [
    { label: t('profile.stats.shared'), value: String(myStats.shared) },
    { label: t('profile.stats.borrowed'), value: String(myStats.borrowed) },
    { label: t('profile.stats.groups'), value: String(groupCount) },
  ];

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Avatar name={me.displayName} uri={me.avatarUrl} size={72} />
        <View style={styles.heroText}>
          <AppText variant="display">{me.displayName}</AppText>
          {me.rating ? (
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/reviews/[userId]', params: { userId: me.id } })}>
              <StarRating value={me.rating} size={14} label={`${me.rating.toFixed(1)} · ${t('review.count', { count: me.reviewCount ?? 0 })}`} />
            </Pressable>
          ) : null}
          <AppText variant="caption" tone="muted">
            {me.area}
          </AppText>
        </View>
        <Pressable accessibilityRole="button" style={styles.settings} hitSlop={12} onPress={() => router.push('/settings')}>
          <MaterialCommunityIcons name="cog-outline" size={24} color={colors.text} />
        </Pressable>
      </View>

      <Card style={styles.stats}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <AppText variant="title">{stat.value}</AppText>
            <AppText variant="caption" tone="muted">
              {stat.label}
            </AppText>
          </View>
        ))}
      </Card>

      <Card padded={false} style={styles.links}>
        <ListRow icon="swap-horizontal" label={t('transactions.title')} value={activeCount > 0 ? String(activeCount) : undefined} onPress={() => router.push('/transactions')} />
      </Card>

      <AppText variant="title" style={styles.sectionTitle}>
        {t('profile.myItems')}
      </AppText>
      {!itemsLoaded && myItems.length === 0 ? (
        failed ? (
          <EmptyState icon="wifi-off" title={t('errors.title')} body={t('errors.body')} ctaLabel={t('errors.retry')} onCta={retry} />
        ) : (
          <ItemGridSkeleton cellWidth={cellWidth} count={2} />
        )
      ) : null}
      {itemsLoaded && myItems.length === 0 ? (
        <EmptyState icon="package-variant" title={t('profile.emptyItemsTitle')} body={t('profile.emptyItemsBody')} ctaLabel={t('discover.emptyCta')} onCta={openCreate} />
      ) : null}
      <View style={styles.grid}>
        {myItems.map((item) => (
          <View key={item.id} style={item.requestType === 'WANTED' ? styles.gridRow : styles.gridCell}>
            <ItemCard item={item} onPress={openItem} />
          </View>
        ))}
      </View>
    </Screen>
  );
}
