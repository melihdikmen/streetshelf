import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText, Avatar, Button, Celebration, Chip, Field, Screen, StarRating } from '../../src/components';
import { styles } from '../../src/screens/review/[transactionId].styles';
import { useSession } from '../../src/stores/session';

const TAGS = ['punctual', 'careful', 'communicative', 'asDescribed', 'flexible'] as const;

/**
 * Post-transaction rating. Big stars first (the one decision), then quick
 * tags, then an optional line. Submitting is the peak moment, so it ends
 * on the celebration rather than a toast.
 */
export default function ReviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const me = useSession((s) => s.me);
  const tx = useSession((s) => s.transactions.find((candidate) => candidate.id === transactionId));
  const addReview = useSession((s) => s.addReview);
  const profiles = useSession((s) => s.profiles);
  const itemCache = useSession((s) => s.itemCache);
  const showError = useSession((s) => s.showError);
  const [sending, setSending] = useState(false);

  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  if (!tx) return null;
  const otherId = tx.ownerId === me.id ? tx.borrowerId : tx.ownerId;
  const other = profiles[otherId] ?? { id: otherId, displayName: '…' };
  const item = itemCache[tx.itemId];

  const submit = async () => {
    setSending(true);
    try {
      await addReview({ transactionId: tx.id, rating, tags, comment: comment.trim() || undefined });
      setDone(true);
    } catch (error) {
      showError(error);
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <Screen padded={false} edges={['left', 'right', 'bottom']}>
        <Celebration
          title={t('review.doneTitle')}
          body={t('review.doneBody', { name: other.displayName })}
          primaryLabel={t('common.done')}
          onPrimary={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      edges={['left', 'right']}
      footer={<Button label={t('review.submit')} variant="accent" size="lg" fullWidth loading={sending} disabled={rating === 0} onPress={submit} />}
    >
      <View style={styles.body}>
        <View style={styles.person}>
          <Avatar name={other.displayName} uri={other.avatarUrl} size={72} />
          <AppText variant="title" style={styles.centered}>
            {t('review.prompt', { name: other.displayName })}
          </AppText>
          {item ? (
            <AppText variant="caption" tone="muted">
              {item.title}
            </AppText>
          ) : null}
        </View>
        <View style={styles.stars}>
          <StarRating value={rating} onChange={setRating} size={40} />
        </View>
        <View style={styles.tags}>
          {TAGS.map((tag) => (
            <Chip
              key={tag}
              label={t(`review.tags.${tag}`)}
              selected={tags.includes(tag)}
              onPress={() => setTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]))}
            />
          ))}
        </View>
        <Field label={t('review.commentLabel')} placeholder={t('review.commentPlaceholder')} value={comment} onChangeText={setComment} multiline maxLength={500} />
      </View>
    </Screen>
  );
}
