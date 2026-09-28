import type { ItemType, RequestType } from '../../types/domain';
import { supabase } from './client';
import { toAppError, unwrap } from './errors';
import type { ItemExtras, ItemRow } from './mappers';
import { randomName, uploadPhoto } from './storage';

/** Every column a client may read. Never `location`; the grant would refuse it anyway. */
export const ITEM_COLUMNS =
  'id, owner_id, title, description, images, item_type, request_type, price_per_day, is_group_only, status, created_at';

export interface Origin {
  latitude: number;
  longitude: number;
}

export interface RawItem {
  row: ItemRow;
  extras: ItemExtras;
}

export interface FeedQuery {
  origin: Origin;
  radiusM: number;
  direction: RequestType;
  types: ItemType[] | null;
  groupId: string | null;
}

/**
 * One page of the Discover feed: the public radius feed, or a group's feed.
 * Distance and the fuzzed pin come back from the RPC; coordinates never do.
 */
export async function getFeed(query: FeedQuery): Promise<RawItem[]> {
  const rows = query.groupId
    ? unwrap(
        await supabase.rpc('group_items', {
          p_group_id: query.groupId,
          p_request_type: query.direction,
          p_item_types: query.types ?? undefined,
          p_lat: query.origin.latitude,
          p_lng: query.origin.longitude,
        }),
      )
    : unwrap(
        await supabase.rpc('nearby_items', {
          p_lat: query.origin.latitude,
          p_lng: query.origin.longitude,
          p_radius_m: query.radiusM,
          p_request_type: query.direction,
          p_item_types: query.types ?? undefined,
        }),
      );
  return rows.map((r) => ({
    row: r,
    extras: {
      groupIds: r.group_ids,
      distanceM: r.distance_m,
      approxLat: r.approx_lat,
      approxLng: r.approx_lng,
      reservedUntil: r.reserved_until,
    },
  }));
}

/**
 * Loads listings by id with their group links and positions. Used for the
 * detail screen, a profile's listings, search results and transaction rows.
 */
export async function getItemsByIds(ids: string[], origin: Origin | null): Promise<RawItem[]> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];
  const [rows, links, positions] = await Promise.all([
    supabase.from('items').select(ITEM_COLUMNS).in('id', unique),
    supabase.from('item_groups').select('item_id, group_id').in('item_id', unique),
    supabase.rpc('item_positions', {
      p_item_ids: unique,
      p_lat: origin?.latitude,
      p_lng: origin?.longitude,
    }),
  ]);
  return attach(unwrap(rows), unwrap(links), unwrap(positions));
}

/** Pairs rows with their group links and positions. */
function attach(
  rows: ItemRow[],
  links: { item_id: string; group_id: string }[],
  positions: {
    id: string;
    distance_m: number | null;
    approx_lat: number | null;
    approx_lng: number | null;
    reserved_until: string | null;
  }[],
): RawItem[] {
  const groupsByItem = new Map<string, string[]>();
  for (const link of links) groupsByItem.set(link.item_id, [...(groupsByItem.get(link.item_id) ?? []), link.group_id]);
  const positionById = new Map(positions.map((p) => [p.id, p]));
  return rows.map((row) => {
    const position = positionById.get(row.id);
    return {
      row,
      extras: {
        groupIds: groupsByItem.get(row.id) ?? [],
        distanceM: position?.distance_m ?? null,
        approxLat: position?.approx_lat ?? null,
        approxLng: position?.approx_lng ?? null,
        reservedUntil: position?.reserved_until ?? null,
      },
    };
  });
}

/** Listings owned by one person, newest first. RLS hides what the caller may not see. */
export async function getItemsByOwner(ownerId: string, origin: Origin | null): Promise<RawItem[]> {
  const rows = unwrap(
    await supabase.from('items').select('id').eq('owner_id', ownerId).order('created_at', { ascending: false }).limit(100),
  );
  const raw = await getItemsByIds(rows.map((r) => r.id), origin);
  const order = new Map(rows.map((r, i) => [r.id, i]));
  return raw.sort((a, b) => (order.get(a.row.id) ?? 0) - (order.get(b.row.id) ?? 0));
}

/**
 * Title and description search over everything the caller can see.
 * `%` and `_` in the query are escaped so they match literally.
 */
export async function searchItems(query: string, origin: Origin | null, excludeOwnerId: string): Promise<RawItem[]> {
  const term = query.trim().replace(/[\\%_,()]/g, (c) => `\\${c}`);
  if (!term) return [];
  const rows = unwrap(
    await supabase
      .from('items')
      .select('id')
      .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
      .eq('status', 'ACTIVE')
      .neq('owner_id', excludeOwnerId)
      .order('created_at', { ascending: false })
      .limit(40),
  );
  return getItemsByIds(rows.map((r) => r.id), origin);
}

export interface NewItemInput {
  title: string;
  description: string;
  localPhotos: string[];
  itemType: ItemType;
  requestType: RequestType;
  pricePerDay?: number;
  groupIds: string[];
}

/**
 * Uploads the photos, then creates the listing and its group links in one
 * RPC. Photos upload in parallel; if one fails nothing is created, and the
 * orphaned objects are harmless (the bucket is per-user and overwritable).
 *
 * @returns The new listing's id.
 */
export async function createItem(userId: string, input: NewItemInput, origin: Origin): Promise<string> {
  const paths = input.localPhotos.map(() => `items/${userId}/${randomName()}`);
  await Promise.all(input.localPhotos.map((uri, i) => uploadPhoto('item-images', paths[i], uri)));
  const row = unwrap(
    await supabase.rpc('create_item', {
      p_title: input.title,
      p_description: input.description,
      p_images: paths,
      p_item_type: input.itemType,
      p_request_type: input.requestType,
      // Ignored by the RPC unless the listing is RENT.
      p_price_per_day: input.itemType === 'RENT' ? (input.pricePerDay ?? 0) : 0,
      p_lat: origin.latitude,
      p_lng: origin.longitude,
      p_group_ids: input.groupIds,
    }),
  );
  return row.id;
}

/** A photo in the listing form: already stored (`path`) or just picked (`uri` only). */
export interface ListingPhoto {
  uri: string;
  path?: string;
}

export interface ItemEdits {
  title: string;
  description: string;
  photos: ListingPhoto[];
  pricePerDay?: number;
  groupIds: string[];
}

/**
 * Saves an owner's edits. New photos are uploaded; kept ones reuse their
 * stored path, so re-saving a listing never re-uploads what is already there.
 * Order is preserved (the first photo is the cover).
 */
export async function updateItem(userId: string, itemId: string, edits: ItemEdits): Promise<void> {
  const paths = await Promise.all(
    edits.photos.map(async (photo) => {
      if (photo.path) return photo.path;
      const path = `items/${userId}/${randomName()}`;
      await uploadPhoto('item-images', path, photo.uri);
      return path;
    }),
  );
  const { error } = await supabase.rpc('update_item', {
    p_item_id: itemId,
    p_title: edits.title,
    p_description: edits.description,
    p_images: paths,
    // Ignored by the RPC unless the listing is RENT.
    p_price_per_day: edits.pricePerDay ?? 0,
    p_group_ids: edits.groupIds,
  });
  if (error) throw toAppError(error);
}

export async function archiveItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('items').update({ status: 'ARCHIVED' }).eq('id', itemId);
  if (error) throw toAppError(error);
}

/** Days the owner closed, `YYYY-MM-DD`. */
export async function getUnavailableDates(itemId: string): Promise<string[]> {
  const rows = unwrap(await supabase.from('item_unavailable_dates').select('day').eq('item_id', itemId));
  return rows.map((r) => r.day);
}

export async function setUnavailableDates(itemId: string, days: string[]): Promise<void> {
  const { error } = await supabase.rpc('set_unavailable_dates', { p_item_id: itemId, p_days: days });
  if (error) throw toAppError(error);
}
