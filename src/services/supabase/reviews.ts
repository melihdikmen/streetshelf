import type { Review } from '../../types/domain';
import { supabase } from './client';
import { toAppError, unwrap } from './errors';
import { toReview } from './mappers';

const REVIEW_COLUMNS = 'id, transaction_id, from_id, to_id, rating, tags, comment, created_at';

/** Reviews someone received, newest first. */
export async function getReviewsFor(userId: string): Promise<Review[]> {
  const rows = unwrap(
    await supabase.from('reviews').select(REVIEW_COLUMNS).eq('to_id', userId).order('created_at', { ascending: false }).limit(100),
  );
  return rows.map(toReview);
}

/** Transactions the caller has already rated, so the CTA can say so. */
export async function getMyReviewedTransactionIds(userId: string): Promise<string[]> {
  const rows = unwrap(await supabase.from('reviews').select('transaction_id').eq('from_id', userId));
  return rows.map((r) => r.transaction_id);
}

export async function submitReview(transactionId: string, rating: number, tags: string[], comment?: string): Promise<void> {
  const { error } = await supabase.rpc('submit_review', {
    p_transaction_id: transactionId,
    p_rating: rating,
    p_tags: tags,
    p_comment: comment?.trim() || undefined,
  });
  if (error) throw toAppError(error);
}
