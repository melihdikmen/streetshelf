import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import {
  AppText,
  Avatar,
  Button,
  ItemCard,
  ItemGridSkeleton,
  ProfileHeaderSkeleton,
  ReviewCard,
  ReviewListSkeleton,
  Screen,
  StarRating,
} from '../../src/components';
import { useGridCellWidth } from '../../src/hooks/useGridCellWidth';
import { styles } from '../../src/screens/user/[id].styles';
import { useSession } from '../../src/stores/session';
import { colors } from '../../src/theme/tokens';
import type { Item } from '../../src/types/domain';

/** Public profile: trust signals first (rating, since), then listings and reviews. */
export default function UserProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useSession((s) => s.me);
  const profiles = useSession((s) => s.profiles);
  const allReviews = useSession((s) => s.reviews);
  const loadProfile = useSession((s) => s.loadProfile);
  const loadReviewsFor = useSession((s) => s.loadReviewsFor);
  const loadUserItems = useSession((s) => s.loadUserItems);
  const showError = useSession((s) => s.showError);
  const [userItems, setUserItems] = useState<Item[] | null>(null);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const cellWidth = useGridCellWidth();
  // One callback for every card, so the memoised ItemCard is not redrawn on
  // each render just because it received a new arrow function.
  const openItem = useCallback((item: Item) => router.push({ pathname: '/item/[id]', params: { id: item.id } }), [router]);
  const user = id === me.id ? me : profiles[id];

  useEffect(() => {
    void Promise.all([
      loadProfile(id),
      loadReviewsFor(id).then(() => setReviewsLoaded(true)),
      loadUserItems(id).then(setUserItems),
    ]).catch(showError);
  }, [id, loadProfile, loadReviewsFor, loadUserItems, showError]);

  const items = useMemo(
    () => (userItems ?? []).filter((i) => i.requestType === 'OFFER' && (i.status === 'ACTIVE' || (i.status === 'RESERVED' && i.owner.id === me.id))),
    [userItems],
  );
  const reviews = useMemo(() => allReviews.filter((r) => r.toId === id), [allReviews, id]);
  const average = useMemo(() => (reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : user?.rating), [reviews, user]);

  if (!user) {
    return (
      <Screen scroll edges={['left', 'right']}>
        <ProfileHeaderSkeleton centered />
        <ItemGridSkeleton cellWidth={cellWidth} count={2} />
      </Screen>
    );
  }
  const since = user.memberSince ? new Date(user.memberSince).getFullYear() : undefined;

  return (
    <Screen scroll edges={['left', 'right']}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.push({ pathname: '/report', params: { userId: user.id, userName: user.displayName } })}>
              <MaterialCommunityIcons name="flag-outline" size={22} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <View style={styles.hero}>
        <Avatar name={user.displayName} uri={user.avatarUrl} size={88} />
        <AppText variant="display">{user.displayName}</AppText>
        {average ? (
          <StarRating value={average} size={18} label={`${average.toFixed(1)} · ${t('review.count', { count: reviews.length || user.reviewCount || 0 })}`} />
        ) : (
          <AppText variant="captionBold" tone="accent">
            {t('review.newMember')}
          </AppText>
        )}
        <AppText variant="caption" tone="muted">
          {[user.area, since ? t('user.since', { year: since }) : null].filter(Boolean).join(' · ')}
        </AppText>
      </View>

      <AppText variant="title" style={styles.sectionTitle}>
        {t('user.listings')} · {items.length}
      </AppText>
      {userItems ? null : <ItemGridSkeleton cellWidth={cellWidth} count={2} />}
      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.id} style={styles.gridCell}>
            <ItemCard item={item} onPress={openItem} />
          </View>
        ))}
      </View>

      <AppText variant="title" style={styles.sectionTitle}>
        {t('user.reviews')} · {reviews.length}
      </AppText>
      <View style={styles.reviews}>
        {reviews.length === 0 && !reviewsLoaded ? <ReviewListSkeleton count={2} /> : null}
        {reviews.length === 0 ? (
          reviewsLoaded ? <AppText tone="muted">{t('review.none')}</AppText> : null
        ) : (
          reviews.slice(0, 3).map((review) => {
            const author = review.fromId === me.id ? me : profiles[review.fromId];
            return author ? <ReviewCard key={review.id} review={review} author={author} /> : null;
          })
        )}
        {reviews.length > 3 ? (
          <Button label={t('review.listTitle')} variant="ghost" onPress={() => router.push({ pathname: '/reviews/[userId]', params: { userId: user.id } })} />
        ) : null}
      </View>
    </Screen>
  );
}
