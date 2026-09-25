import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Profile, Review } from '../../types/domain';
import { formatShortDate } from '../../utils/format';
import { AppText, Avatar, Card, StarRating } from '../atoms';
import { styles } from './ReviewCard.styles';

export interface ReviewCardProps {
  review: Review;
  author: Profile;
}

/** One review: who, stars, tag pills, optional comment. */
export function ReviewCard({ review, author }: ReviewCardProps) {
  const { t } = useTranslation();
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Avatar name={author.displayName} uri={author.avatarUrl} size={36} />
        <View style={styles.headText}>
          <AppText variant="bodyBold">{author.displayName}</AppText>
          <AppText variant="caption" tone="subtle">
            {formatShortDate(review.createdAt.slice(0, 10))}
          </AppText>
        </View>
        <StarRating value={review.rating} size={14} />
      </View>
      {review.tags.length > 0 ? (
        <View style={styles.tags}>
          {review.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <AppText variant="captionBold" tone="accent">
                {t(`review.tags.${tag}` as 'review.tags.punctual')}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
      {review.comment ? <AppText tone="muted">{review.comment}</AppText> : null}
    </Card>
  );
}
