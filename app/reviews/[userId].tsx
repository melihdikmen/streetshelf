import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { AppText, ReviewCard, Screen, StarRating } from '../../src/components';
import { styles } from '../../src/screens/reviews/[userId].styles';
import { useSession } from '../../src/stores/session';

/** All reviews someone has received, with a distribution header. */
export default function ReviewsScreen() {
  const { t } = useTranslation();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const me = useSession((s) => s.me);
  const allReviews = useSession((s) => s.reviews);
  const profiles = useSession((s) => s.profiles);
  const loadReviewsFor = useSession((s) => s.loadReviewsFor);
  const showError = useSession((s) => s.showError);

  useEffect(() => {
    loadReviewsFor(userId).catch(showError);
  }, [loadReviewsFor, showError, userId]);
  const reviews = useMemo(() => allReviews.filter((r) => r.toId === userId), [allReviews, userId]);
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const buckets = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));

  return (
    <Screen padded={false} edges={['left', 'right']}>
      <Stack.Screen options={{ title: t('review.listTitle') }} />
      <FlatList
        data={reviews}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.summary}>
            <View style={styles.average}>
              <AppText variant="display">{average.toFixed(1)}</AppText>
              <StarRating value={average} size={16} />
              <AppText variant="caption" tone="muted">
                {t('review.count', { count: reviews.length })}
              </AppText>
            </View>
            <View style={styles.bars}>
              {buckets.map((b) => (
                <View key={b.star} style={styles.barRow}>
                  <AppText variant="caption" tone="muted" style={styles.barLabel}>
                    {b.star}
                  </AppText>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${reviews.length ? (b.count / reviews.length) * 100 : 0}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        }
        renderItem={({ item: review }) => {
          const author = review.fromId === me.id ? me : profiles[review.fromId];
          return author ? <ReviewCard review={review} author={author} /> : null;
        }}
      />
    </Screen>
  );
}
