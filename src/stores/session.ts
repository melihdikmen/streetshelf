import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import i18n from '../i18n';
import { currentOrigin, FALLBACK_ORIGIN, requestLocation } from '../services/location';
import {
  authApi,
  chatApi,
  groupsApi,
  itemsApi,
  profilesApi,
  reviewsApi,
  safetyApi,
  toAppError,
  transactionsApi,
  type AppErrorCode,
  type ItemEdits,
  type Origin,
  type RawItem,
} from '../services/supabase';
import { toItem } from '../services/supabase/mappers';
import type {
  Conversation,
  Group,
  Item,
  ItemType,
  Message,
  MessageKind,
  Profile,
  RequestType,
  Review,
  Transaction,
} from '../types/domain';

/**
 * App state over Supabase.
 *
 * Screens read plain arrays and records from here and call actions; they
 * never talk to Supabase directly. Every server list is a cache refreshed by
 * an explicit `load*` action (on focus, on pull-to-refresh, on a realtime
 * nudge). Selectors must return stored references: derive filtered arrays in
 * the component with `useMemo` (AGENTS.md, Performance).
 */

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Lists whose first successful load gates the skeleton placeholders. */
export type LoadedKey = 'conversations' | 'transactions' | 'groups' | 'myItems';
const NOTHING_LOADED: Record<LoadedKey, boolean> = {
  conversations: false,
  transactions: false,
  groups: false,
  myItems: false,
};

export interface FeedParams {
  direction: RequestType;
  types: ItemType[] | null;
  groupId: string | null;
}

export interface NewListing {
  title: string;
  description: string;
  localPhotos: string[];
  itemType: ItemType;
  requestType: RequestType;
  pricePerDay?: number;
  groupIds: string[];
}

export interface NewReview {
  transactionId: string;
  rating: number;
  tags: string[];
  comment?: string;
}

export interface ReportInput {
  itemId?: string;
  userId?: string;
  reason: string;
  details?: string;
}

const SIGNED_OUT: Profile = { id: '', displayName: '' };

/**
 * How many threads keep their messages in memory. A thread holds up to 300
 * messages; without a cap every chat opened in a long session would stay
 * resident. Reopening an evicted thread just refetches it (it refetches on
 * open anyway).
 */
const MAX_CACHED_THREADS = 20;

/** Sets one thread's messages, evicting the least recently loaded beyond the cap. */
function withThread(
  messages: Record<string, Message[]>,
  conversationId: string,
  list: Message[],
): Record<string, Message[]> {
  // Re-inserting moves the thread to the end: key order is recency.
  const { [conversationId]: _previous, ...rest } = messages;
  const next: Record<string, Message[]> = { ...rest, [conversationId]: list };
  const ids = Object.keys(next);
  for (const id of ids.slice(0, Math.max(0, ids.length - MAX_CACHED_THREADS))) delete next[id];
  return next;
}

interface SessionState {
  /** False until the persisted session has been read on launch. */
  authReady: boolean;
  userId: string | null;
  /** Finished the name/photo/location steps (stored on the auth user). */
  onboarded: boolean;
  me: Profile;
  myStats: { shared: number; borrowed: number };
  origin: Origin;
  hasLocation: boolean;
  searchRadiusM: number;

  items: Item[];
  feedStatus: LoadStatus;
  feedError: AppErrorCode | null;
  itemCache: Record<string, Item>;
  myItems: Item[];
  profiles: Record<string, Profile>;
  transactions: Transaction[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  groups: Group[];
  reviews: Review[];
  reviewedTransactionIds: string[];
  unavailable: Record<string, string[]>;
  blockedUserIds: string[];
  recentSearches: string[];
  toast: string | null;
  /**
   * True once a list has loaded at least once this session. Screens show
   * skeletons only while this is false; afterwards they keep the cached rows
   * on screen during a refresh.
   */
  loaded: Record<LoadedKey, boolean>;

  bootstrap: () => () => void;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<{ onboarded: boolean }>;
  completeOnboarding: (displayName: string, avatarLocalUri?: string, radiusM?: number) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  enableLocation: () => Promise<boolean>;
  setRadius: (radiusM: number) => void;
  showToast: (message: string) => void;
  showError: (error: unknown) => void;
  clearToast: () => void;

  loadFeed: (params: FeedParams) => Promise<void>;
  loadItem: (id: string) => Promise<void>;
  loadItems: (ids: string[]) => Promise<void>;
  loadMyItems: () => Promise<void>;
  loadUserItems: (userId: string) => Promise<Item[]>;
  loadGroupItems: (groupId: string) => Promise<Item[]>;
  search: (query: string) => Promise<Item[]>;
  publishItem: (input: NewListing) => Promise<string>;
  archiveItem: (itemId: string) => Promise<void>;
  updateItem: (itemId: string, edits: ItemEdits) => Promise<void>;
  loadUnavailable: (itemId: string) => Promise<void>;
  setUnavailableDates: (itemId: string, days: string[]) => Promise<void>;

  loadTransactions: () => Promise<void>;
  refreshTransaction: (id: string) => Promise<void>;
  createRequest: (item: Item, startDate: string, endDate: string, note?: string) => Promise<string>;
  respond: (txId: string, accept: boolean) => Promise<void>;
  cancel: (txId: string) => Promise<void>;
  confirmWithPhoto: (txId: string, kind: 'pickup' | 'return', localUri: string) => Promise<void>;

  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  receiveMessage: (conversationId: string, message: Message) => void;
  sendText: (conversationId: string, body: string) => Promise<void>;
  markRead: (conversationId: string) => void;
  ensureConversation: (item: Item) => Promise<string>;

  loadGroups: () => Promise<void>;
  joinGroup: (code: string) => Promise<Group>;
  createGroup: (name: string) => Promise<Group>;
  leaveGroup: (groupId: string) => Promise<void>;

  loadProfile: (userId: string) => Promise<void>;
  loadReviewsFor: (userId: string) => Promise<void>;
  addReview: (review: NewReview) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  /** Refreshes the block list and the profiles needed to show it. */
  loadBlocked: () => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  report: (input: ReportInput) => Promise<void>;
  rememberSearch: (query: string) => void;
}

/** Chat-list preview for a card message, in the current language. */
function previewFor(kind: MessageKind | null, body: string | null): string {
  if (kind === 'TEXT' || !kind) return body ?? '';
  return i18n.t(`chats.preview.${kind}`);
}

export const useSession = create<SessionState>((set, get) => {
  /** Fetches any owner profiles not yet cached. */
  async function ensureProfiles(ids: string[]): Promise<void> {
    const cached = get().profiles;
    const missing = [...new Set(ids)].filter((id) => !cached[id]);
    if (missing.length === 0) return;
    const fetched = await profilesApi.getProfiles(missing);
    set((state) => ({ profiles: { ...state.profiles, ...Object.fromEntries(fetched.map((p) => [p.id, p])) } }));
  }

  /** Turns raw rows into Items, filling owners and groups, and caches them. */
  async function hydrate(raw: RawItem[]): Promise<Item[]> {
    await ensureProfiles(raw.map((r) => r.row.owner_id));
    const { profiles, groups, unavailable, userId } = get();
    const items = raw.map((r) => {
      // Distance to your own listing is noise ("0 m"); the cards hide a null one.
      const extras = r.row.owner_id === userId ? { ...r.extras, distanceM: null } : r.extras;
      const item = toItem(r.row, extras, profiles, groups);
      return { ...item, unavailableDates: unavailable[item.id] ?? [] };
    });
    set((state) => ({ itemCache: { ...state.itemCache, ...Object.fromEntries(items.map((i) => [i.id, i])) } }));
    return items;
  }

  /** Loads everything a signed-in session needs before the first screen. */
  async function loadSignedIn(session: Session): Promise<void> {
    const userId = session.user.id;
    const onboarded = await authApi.isOnboarded(session.user.user_metadata?.onboarded === true);
    set({ userId, onboarded });
    const [summary, prefs] = await Promise.all([
      profilesApi.getProfileSummary(userId),
      profilesApi.getMyPreferences(userId),
    ]);
    if (summary) {
      set((state) => ({
        me: summary.profile,
        myStats: summary.stats,
        searchRadiusM: prefs.searchRadiusM,
        profiles: { ...state.profiles, [userId]: summary.profile },
      }));
    }
    void currentOrigin()
      .then((origin) => origin && set({ origin, hasLocation: true }))
      .catch(() => undefined);
    await Promise.all([
      get().loadGroups(),
      safetyApi.getBlockedIds().then((blockedUserIds) => set({ blockedUserIds })),
      reviewsApi.getMyReviewedTransactionIds(userId).then((reviewedTransactionIds) => set({ reviewedTransactionIds })),
    ]).catch(() => undefined);
  }

  /** Back to a clean slate, keeping only device-level preferences. */
  function reset(): void {
    set({
      userId: null,
      onboarded: false,
      me: SIGNED_OUT,
      myStats: { shared: 0, borrowed: 0 },
      items: [],
      feedStatus: 'idle',
      feedError: null,
      itemCache: {},
      myItems: [],
      profiles: {},
      transactions: [],
      conversations: [],
      messages: {},
      groups: [],
      reviews: [],
      reviewedTransactionIds: [],
      unavailable: {},
      blockedUserIds: [],
      loaded: NOTHING_LOADED,
    });
  }

  /** Records a list's first successful load. */
  function markLoaded(key: LoadedKey): void {
    if (!get().loaded[key]) set((state) => ({ loaded: { ...state.loaded, [key]: true } }));
  }

  let feedRequest = 0;

  return {
    authReady: false,
    userId: null,
    onboarded: false,
    me: SIGNED_OUT,
    myStats: { shared: 0, borrowed: 0 },
    origin: FALLBACK_ORIGIN,
    hasLocation: false,
    searchRadiusM: 1000,
    items: [],
    feedStatus: 'idle',
    feedError: null,
    itemCache: {},
    myItems: [],
    profiles: {},
    transactions: [],
    conversations: [],
    messages: {},
    groups: [],
    reviews: [],
    reviewedTransactionIds: [],
    unavailable: {},
    blockedUserIds: [],
    recentSearches: [],
    toast: null,
    loaded: NOTHING_LOADED,

    bootstrap: () => {
      void (async () => {
        try {
          const session = await authApi.currentSession();
          if (session) await loadSignedIn(session);
        } catch {
          // A failed first load leaves the user signed in with empty lists;
          // every screen reloads on focus, so nothing is stuck.
        } finally {
          set({ authReady: true });
        }
      })();
      return authApi.onAuthStateChange((session) => {
        if (!session) reset();
      });
    },

    sendOtp: async (email) => authApi.sendOtp(email),

    verifyOtp: async (email, code) => {
      const session = await authApi.verifyOtp(email, code);
      await loadSignedIn(session);
      return { onboarded: get().onboarded };
    },

    completeOnboarding: async (displayName, avatarLocalUri, radiusM) => {
      const userId = get().userId;
      if (!userId) throw toAppError('not_signed_in');
      await profilesApi.updateMyProfile(userId, { displayName, avatarLocalUri, searchRadiusM: radiusM });
      await authApi.markOnboarded();
      const summary = await profilesApi.getProfileSummary(userId);
      set((state) => ({
        onboarded: true,
        searchRadiusM: radiusM ?? state.searchRadiusM,
        ...(summary ? { me: summary.profile, myStats: summary.stats } : {}),
      }));
    },

    signOut: async () => {
      await authApi.signOut();
      reset();
    },

    deleteAccount: async () => {
      await authApi.deleteAccount();
      reset();
    },

    enableLocation: async () => {
      const granted = await requestLocation();
      if (granted) {
        const origin = await currentOrigin().catch(() => null);
        if (origin) set({ origin, hasLocation: true });
      }
      return granted;
    },

    setRadius: (searchRadiusM) => {
      set({ searchRadiusM });
      const userId = get().userId;
      if (userId) void profilesApi.updateMyProfile(userId, { searchRadiusM }).catch(() => undefined);
    },

    showToast: (toast) => set({ toast }),
    showError: (error) => set({ toast: i18n.t(`errors.codes.${toAppError(error).code}`) }),
    clearToast: () => set({ toast: null }),

    loadFeed: async (params) => {
      // Only the latest request may write: a slow response to an old filter
      // must not overwrite the list the user is now looking at.
      const request = ++feedRequest;
      set({ feedStatus: get().items.length ? 'ready' : 'loading', feedError: null });
      try {
        const { origin, searchRadiusM } = get();
        const raw = await itemsApi.getFeed({ origin, radiusM: searchRadiusM, ...params });
        const items = await hydrate(raw);
        if (request === feedRequest) set({ items, feedStatus: 'ready' });
      } catch (error) {
        if (request === feedRequest) set({ feedStatus: 'error', feedError: toAppError(error).code });
      }
    },

    loadItem: async (id) => get().loadItems([id]),

    loadItems: async (ids) => {
      const raw = await itemsApi.getItemsByIds(ids, get().hasLocation ? get().origin : null);
      await hydrate(raw);
    },

    loadMyItems: async () => {
      const userId = get().userId;
      if (!userId) return;
      const myItems = await hydrate(await itemsApi.getItemsByOwner(userId, null));
      set({ myItems });
      markLoaded('myItems');
    },

    loadUserItems: async (userId) => hydrate(await itemsApi.getItemsByOwner(userId, get().origin)),

    loadGroupItems: async (groupId) =>
      hydrate(await itemsApi.getFeed({ origin: get().origin, radiusM: 0, direction: 'OFFER', types: null, groupId })),

    search: async (query) => {
      const userId = get().userId;
      if (!userId) return [];
      return hydrate(await itemsApi.searchItems(query, get().origin, userId));
    },

    publishItem: async (input) => {
      const userId = get().userId;
      if (!userId) throw toAppError('not_signed_in');
      const id = await itemsApi.createItem(userId, input, get().origin);
      await get().loadMyItems();
      return id;
    },

    updateItem: async (itemId, edits) => {
      const userId = get().userId;
      if (!userId) throw toAppError('not_signed_in');
      await itemsApi.updateItem(userId, itemId, edits);
      await Promise.all([get().loadItem(itemId), get().loadMyItems()]);
    },

    archiveItem: async (itemId) => {
      await itemsApi.archiveItem(itemId);
      set((state) => ({
        myItems: state.myItems.map((i) => (i.id === itemId ? { ...i, status: 'ARCHIVED' } : i)),
        itemCache: state.itemCache[itemId]
          ? { ...state.itemCache, [itemId]: { ...state.itemCache[itemId], status: 'ARCHIVED' } }
          : state.itemCache,
      }));
    },

    loadUnavailable: async (itemId) => {
      const days = await itemsApi.getUnavailableDates(itemId);
      set((state) => ({
        unavailable: { ...state.unavailable, [itemId]: days },
        itemCache: state.itemCache[itemId]
          ? { ...state.itemCache, [itemId]: { ...state.itemCache[itemId], unavailableDates: days } }
          : state.itemCache,
      }));
    },

    setUnavailableDates: async (itemId, days) => {
      await itemsApi.setUnavailableDates(itemId, days);
      await get().loadUnavailable(itemId);
    },

    loadTransactions: async () => {
      const transactions = await transactionsApi.getMyTransactions();
      set({ transactions });
      const missing = transactions.map((t) => t.itemId).filter((id) => !get().itemCache[id]);
      await Promise.all([
        missing.length ? get().loadItems(missing) : Promise.resolve(),
        ensureProfiles(transactions.flatMap((t) => [t.ownerId, t.borrowerId])),
      ]);
      markLoaded('transactions');
    },

    refreshTransaction: async (id) => {
      const tx = await transactionsApi.getTransaction(id);
      if (!tx) return;
      set((state) => ({
        transactions: state.transactions.some((t) => t.id === id)
          ? state.transactions.map((t) => (t.id === id ? tx : t))
          : [tx, ...state.transactions],
      }));
    },

    createRequest: async (item, startDate, endDate, note) => {
      const txId = await transactionsApi.requestTransaction(item.id, startDate, endDate, note);
      const conversationId = await chatApi.ensureConversation(item.id);
      await Promise.all([get().refreshTransaction(txId), get().loadConversations()]);
      return conversationId;
    },

    respond: async (txId, accept) => {
      await transactionsApi.respondTransaction(txId, accept);
      await get().refreshTransaction(txId);
    },

    cancel: async (txId) => {
      await transactionsApi.cancelTransaction(txId);
      await get().refreshTransaction(txId);
    },

    confirmWithPhoto: async (txId, kind, localUri) => {
      await transactionsApi.confirmWithPhoto(txId, kind, localUri);
      await get().refreshTransaction(txId);
    },

    loadConversations: async () => {
      const summaries = await chatApi.getMyConversations();
      const needed = summaries.map((s) => s.itemId).filter((id) => !get().itemCache[id]);
      await Promise.all([
        needed.length ? get().loadItems(needed) : Promise.resolve(),
        ensureProfiles(summaries.map((s) => s.otherId)),
      ]);
      const { itemCache, profiles } = get();
      const conversations: Conversation[] = summaries
        .filter((s) => itemCache[s.itemId] && profiles[s.otherId])
        .map((s) => ({
          id: s.id,
          item: itemCache[s.itemId],
          other: profiles[s.otherId],
          lastMessage: previewFor(s.lastKind, s.lastBody),
          lastMessageAt: s.lastMessageAt,
          unread: s.unread,
        }));
      set({ conversations });
      markLoaded('conversations');
    },

    loadMessages: async (conversationId) => {
      const list = await chatApi.getMessages(conversationId);
      const txIds = [...new Set(list.map((m) => m.transactionId).filter((id): id is string => !!id))];
      const known = new Set(get().transactions.map((t) => t.id));
      await Promise.all(txIds.filter((id) => !known.has(id)).map((id) => get().refreshTransaction(id)));
      set((state) => ({ messages: withThread(state.messages, conversationId, list) }));
    },

    receiveMessage: (conversationId, message) =>
      set((state) => {
        const current = state.messages[conversationId] ?? [];
        if (current.some((m) => m.id === message.id)) return state;
        return { messages: { ...state.messages, [conversationId]: [...current, message] } };
      }),

    sendText: async (conversationId, body) => {
      const userId = get().userId;
      if (!userId) throw toAppError('not_signed_in');
      await chatApi.sendText(conversationId, userId, body);
    },

    markRead: (conversationId) => {
      set((state) => ({
        conversations: state.conversations.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)),
      }));
      void chatApi.markRead(conversationId).catch(() => undefined);
    },

    ensureConversation: async (item) => {
      const id = await chatApi.ensureConversation(item.id);
      if (!get().conversations.some((c) => c.id === id)) await get().loadConversations();
      return id;
    },

    loadGroups: async () => {
      const groups = await groupsApi.getMyGroups();
      set({ groups });
      markLoaded('groups');
    },

    joinGroup: async (code) => {
      const id = await groupsApi.joinGroup(code.trim().toUpperCase());
      await get().loadGroups();
      const group = get().groups.find((g) => g.id === id);
      if (!group) throw toAppError('invite_not_found');
      return group;
    },

    createGroup: async (name) => {
      const id = await groupsApi.createGroup(name.trim());
      await get().loadGroups();
      const group = get().groups.find((g) => g.id === id);
      if (!group) throw toAppError('unknown');
      return group;
    },

    leaveGroup: async (groupId) => {
      const userId = get().userId;
      if (!userId) return;
      await groupsApi.leaveGroup(groupId, userId);
      set((state) => ({ groups: state.groups.filter((g) => g.id !== groupId) }));
    },

    loadProfile: async (userId) => {
      const summary = await profilesApi.getProfileSummary(userId);
      if (!summary) return;
      set((state) => ({
        profiles: { ...state.profiles, [userId]: summary.profile },
        ...(userId === state.userId ? { me: summary.profile, myStats: summary.stats } : {}),
      }));
    },

    loadReviewsFor: async (userId) => {
      const fetched = await reviewsApi.getReviewsFor(userId);
      await ensureProfiles(fetched.map((r) => r.fromId));
      set((state) => ({ reviews: [...state.reviews.filter((r) => r.toId !== userId), ...fetched] }));
    },

    addReview: async (review) => {
      await reviewsApi.submitReview(review.transactionId, review.rating, review.tags, review.comment);
      set((state) => ({ reviewedTransactionIds: [...state.reviewedTransactionIds, review.transactionId] }));
    },

    blockUser: async (userId) => {
      const me = get().userId;
      if (!me) return;
      await safetyApi.blockUser(me, userId);
      set((state) => ({
        blockedUserIds: [...new Set([...state.blockedUserIds, userId])],
        items: state.items.filter((i) => i.owner.id !== userId),
      }));
    },

    loadBlocked: async () => {
      const blockedUserIds = await safetyApi.getBlockedIds();
      await ensureProfiles(blockedUserIds);
      set({ blockedUserIds });
    },

    unblockUser: async (userId) => {
      const me = get().userId;
      if (!me) return;
      await safetyApi.unblockUser(me, userId);
      set((state) => ({ blockedUserIds: state.blockedUserIds.filter((id) => id !== userId) }));
    },

    report: async (input) => {
      const me = get().userId;
      if (!me) throw toAppError('not_signed_in');
      await safetyApi.report(me, input);
    },

    rememberSearch: (query) =>
      set((state) => ({
        recentSearches: [query, ...state.recentSearches.filter((q) => q !== query)].slice(0, 6),
      })),
  };
});
