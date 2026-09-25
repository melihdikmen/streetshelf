import type { Profile } from '../../types/domain';
import { supabase } from './client';
import { toAppError, unwrap } from './errors';
import { toProfile } from './mappers';
import { publicUrl, uploadPhoto } from './storage';

const PROFILE_COLUMNS = 'id, display_name, avatar_path, area, created_at';

/**
 * Loads profiles with their ratings, two queries for any number of people.
 *
 * @param ids Profile ids; duplicates are fine.
 */
export async function getProfiles(ids: string[]): Promise<Profile[]> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];
  const [rows, ratings] = await Promise.all([
    supabase.from('profiles').select(PROFILE_COLUMNS).in('id', unique),
    supabase.from('profile_ratings').select('user_id, rating, review_count').in('user_id', unique),
  ]);
  const ratingById = new Map((unwrap(ratings) ?? []).map((r) => [r.user_id, r]));
  return unwrap(rows).map((row) => toProfile(row, ratingById.get(row.id)));
}

export interface ProfileStats {
  shared: number;
  borrowed: number;
}

/** Header data for a profile screen, own or someone else's. */
export async function getProfileSummary(id: string): Promise<{ profile: Profile; stats: ProfileStats } | null> {
  const rows = unwrap(await supabase.rpc('profile_summary', { p_user_id: id }));
  const row = rows[0];
  if (!row) return null;
  return {
    profile: {
      id: row.id,
      displayName: row.display_name,
      avatarUrl: publicUrl('avatars', row.avatar_path),
      area: row.area ?? undefined,
      memberSince: row.member_since,
      rating: row.rating ?? undefined,
      reviewCount: row.review_count,
    },
    stats: { shared: row.shared_count, borrowed: row.borrowed_count },
  };
}

/**
 * Updates what neighbours see. A local avatar URI is uploaded first; the
 * bucket policy only allows `avatars/<own id>.jpg`.
 */
export async function updateMyProfile(
  userId: string,
  changes: { displayName?: string; avatarLocalUri?: string; area?: string; searchRadiusM?: number },
): Promise<void> {
  let avatarPath: string | undefined;
  if (changes.avatarLocalUri) {
    avatarPath = `avatars/${userId}.jpg`;
    await uploadPhoto('avatars', avatarPath, changes.avatarLocalUri);
  }
  const { error } = await supabase
    .from('profiles')
    .update({
      ...(changes.displayName !== undefined ? { display_name: changes.displayName } : {}),
      ...(avatarPath ? { avatar_path: avatarPath } : {}),
      ...(changes.area !== undefined ? { area: changes.area } : {}),
      ...(changes.searchRadiusM !== undefined ? { search_radius_m: changes.searchRadiusM } : {}),
    })
    .eq('id', userId);
  if (error) throw toAppError(error);
}

/** The signed-in user's stored preferences. */
export async function getMyPreferences(userId: string): Promise<{ searchRadiusM: number }> {
  const rows = unwrap(await supabase.from('profiles').select('search_radius_m').eq('id', userId));
  return { searchRadiusM: rows[0]?.search_radius_m ?? 1000 };
}
