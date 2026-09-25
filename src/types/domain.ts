/**
 * Domain types for NeighborLend, mirroring the Supabase schema in
 * `supabase/migrations/0001_init.sql`. Kept hand-written and small so the UI
 * can be built against mock data before the backend is wired.
 */

export type ItemType = 'GIFT' | 'LEND' | 'RENT';
export type RequestType = 'OFFER' | 'WANTED';
export type ItemStatus = 'ACTIVE' | 'RESERVED' | 'COMPLETED' | 'ARCHIVED';
export type TransactionStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED';
export type MessageKind = 'TEXT' | 'REQUEST' | 'PICKUP_PHOTO' | 'RETURN_PHOTO' | 'SYSTEM';

export interface Profile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  /** Average of received reviews, 1–5; undefined until the first one. */
  rating?: number;
  reviewCount?: number;
  /** ISO date of sign-up, shown as "since 2026". */
  memberSince?: string;
  /** Free-text neighbourhood label, never an address. */
  area?: string;
}

export interface Review {
  id: string;
  transactionId: string;
  fromId: string;
  toId: string;
  rating: number;
  tags: string[];
  comment?: string;
  createdAt: string;
}

/** Coordinates already fuzzed by the backend to ~100 m; only used for map pins. */
export interface ApproxLocation {
  latitude: number;
  longitude: number;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
  /** Whether the signed-in user administers it. */
  isAdmin?: boolean;
}

export interface Item {
  id: string;
  owner: Profile;
  title: string;
  description: string;
  images: string[];
  itemType: ItemType;
  requestType: RequestType;
  /** Per day, only for RENT. On a WANTED listing this is the requester's ceiling. */
  pricePerDay?: number;
  isGroupOnly: boolean;
  /** Groups the listing is visible in; empty means public. */
  groups: Group[];
  /** Days the owner has blocked, `YYYY-MM-DD`. */
  unavailableDates: string[];
  approxLocation?: ApproxLocation;
  /** Rounded to 50 m by the backend; null when the phone has no fix. */
  distanceM: number | null;
  status: ItemStatus;
  /** RESERVED only: last day of the live handover, `YYYY-MM-DD`. */
  reservedUntil?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  ownerId: string;
  borrowerId: string;
  initiatedBy: string;
  status: TransactionStatus;
  startDate: string;
  endDate: string;
  /** RENT only: days × price, paid in cash at the handover. */
  totalAmount: number;
  pickupPhotoUrl?: string;
  returnPhotoUrl?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string | null;
  kind: MessageKind;
  body?: string;
  transactionId?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  item: Item;
  other: Profile;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}
