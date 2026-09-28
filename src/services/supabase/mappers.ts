import type {
  Group,
  Item,
  ItemStatus,
  ItemType,
  Message,
  MessageKind,
  Profile,
  RequestType,
  Review,
  Transaction,
  TransactionStatus,
} from '../../types/domain';
import { publicUrl } from './storage';

/**
 * Row → domain conversions, in one place so a renamed column is one edit.
 * Rows come from both tables and RPCs, so the inputs are structural types
 * rather than the generated Row types.
 */

export interface ProfileRow {
  id: string;
  display_name: string;
  avatar_path: string | null;
  area: string | null;
  created_at: string;
}

export interface RatingRow {
  user_id: string | null;
  rating: number | null;
  review_count: number | null;
}

/** @returns A Profile with its avatar resolved and its rating attached. */
export function toProfile(row: ProfileRow, rating?: RatingRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: publicUrl('avatars', row.avatar_path),
    area: row.area ?? undefined,
    memberSince: row.created_at,
    rating: rating?.rating ?? undefined,
    reviewCount: rating?.review_count ?? undefined,
  };
}

export interface ItemRow {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  images: string[];
  item_type: ItemType;
  request_type: RequestType;
  price_per_day: number | null;
  is_group_only: boolean;
  status: ItemStatus;
  created_at: string;
}

export interface ItemExtras {
  groupIds?: string[];
  distanceM?: number | null;
  approxLat?: number | null;
  approxLng?: number | null;
  reservedUntil?: string | null;
}

/**
 * Builds a domain Item. The owner and group names come from caches the store
 * keeps; a missing owner renders as a neutral placeholder rather than failing.
 */
export function toItem(
  row: ItemRow,
  extras: ItemExtras,
  owners: Record<string, Profile>,
  groups: Group[],
): Item {
  const groupIds = extras.groupIds ?? [];
  return {
    id: row.id,
    owner: owners[row.owner_id] ?? { id: row.owner_id, displayName: '…' },
    title: row.title,
    description: row.description,
    images: row.images.map((path) => publicUrl('item-images', path)).filter((u): u is string => !!u),
    imagePaths: row.images,
    itemType: row.item_type,
    requestType: row.request_type,
    pricePerDay: row.price_per_day ?? undefined,
    isGroupOnly: row.is_group_only,
    groups: groups.filter((g) => groupIds.includes(g.id)),
    unavailableDates: [],
    approxLocation:
      extras.approxLat != null && extras.approxLng != null
        ? { latitude: extras.approxLat, longitude: extras.approxLng }
        : undefined,
    distanceM: extras.distanceM ?? null,
    status: row.status,
    reservedUntil: row.status === 'RESERVED' ? (extras.reservedUntil ?? undefined) : undefined,
    createdAt: row.created_at,
  };
}

export interface TransactionRow {
  id: string;
  item_id: string;
  owner_id: string;
  borrower_id: string;
  initiated_by: string;
  status: TransactionStatus;
  start_date: string;
  end_date: string;
  total_amount: number;
  pickup_photo_path: string | null;
  return_photo_path: string | null;
}

/** @param urls Resolved handover photo URLs, keyed by stored path. */
export function toTransaction(row: TransactionRow, urls: Map<string, string>): Transaction {
  return {
    id: row.id,
    itemId: row.item_id,
    ownerId: row.owner_id,
    borrowerId: row.borrower_id,
    initiatedBy: row.initiated_by,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    totalAmount: Number(row.total_amount),
    pickupPhotoUrl: row.pickup_photo_path ? urls.get(row.pickup_photo_path) : undefined,
    returnPhotoUrl: row.return_photo_path ? urls.get(row.return_photo_path) : undefined,
  };
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  kind: MessageKind;
  body: string | null;
  transaction_id: string | null;
  photo_path: string | null;
  created_at: string;
}

export function toMessage(row: MessageRow, urls: Map<string, string>): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    kind: row.kind,
    body: row.body ?? undefined,
    transactionId: row.transaction_id ?? undefined,
    photoUrl: row.photo_path ? urls.get(row.photo_path) : undefined,
    createdAt: row.created_at,
  };
}

export interface ReviewRow {
  id: string;
  transaction_id: string;
  from_id: string;
  to_id: string;
  rating: number;
  tags: string[];
  comment: string | null;
  created_at: string;
}

export function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    fromId: row.from_id,
    toId: row.to_id,
    rating: row.rating,
    tags: row.tags,
    comment: row.comment ?? undefined,
    createdAt: row.created_at,
  };
}
