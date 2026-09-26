import type { RealtimeChannel } from '@supabase/supabase-js';

import type { Message, MessageKind } from '../../types/domain';
import { supabase } from './client';
import { toAppError, unwrap } from './errors';
import { toMessage, type MessageRow } from './mappers';
import { signedHandoverUrls } from './storage';

/**
 * A fresh channel name for every subscription.
 *
 * `supabase.channel(name)` returns the existing channel when one with that
 * name is still registered, and `removeChannel` is asynchronous. So when a
 * screen remounts (fast refresh, sign-out and back in, navigating away and
 * back quickly) the old channel is often still there, already subscribed, and
 * adding listeners to it throws "cannot add postgres_changes callbacks after
 * subscribe()". The name is only a label; the filter decides what arrives.
 */
function uniqueTopic(base: string): string {
  return `${base}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

const MESSAGE_COLUMNS = 'id, conversation_id, sender_id, kind, body, transaction_id, photo_path, created_at';

export interface ConversationSummary {
  id: string;
  itemId: string;
  otherId: string;
  lastMessageAt: string;
  lastKind: MessageKind | null;
  lastBody: string | null;
  lastSenderId: string | null;
  unread: number;
}

/** The chat list, with unread counts, in one RPC. */
export async function getMyConversations(): Promise<ConversationSummary[]> {
  const rows = unwrap(await supabase.rpc('my_conversations'));
  return rows.map((r) => ({
    id: r.id,
    itemId: r.item_id,
    otherId: r.other_id,
    lastMessageAt: r.last_message_at,
    lastKind: r.last_kind,
    lastBody: r.last_body,
    lastSenderId: r.last_sender_id,
    unread: r.unread,
  }));
}

/** Maps rows and resolves any handover photos in one signed-URL request. */
async function mapMessages(rows: MessageRow[]): Promise<Message[]> {
  const urls = await signedHandoverUrls(rows.map((r) => r.photo_path).filter((p): p is string => !!p));
  return rows.map((row) => toMessage(row, urls));
}

/** A thread's messages, oldest first. Capped; older history is not paged yet. */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const rows = unwrap(
    await supabase
      .from('messages')
      .select(MESSAGE_COLUMNS)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(300),
  );
  return mapMessages(rows);
}

/** Maps one realtime row. */
export async function mapMessageRow(row: MessageRow): Promise<Message> {
  return (await mapMessages([row]))[0];
}

export async function sendText(conversationId: string, senderId: string, body: string): Promise<void> {
  const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: senderId, kind: 'TEXT', body });
  if (error) throw toAppError(error);
}

/**
 * Finds or opens the thread between the caller and a listing's owner.
 *
 * @returns The conversation id.
 */
export async function ensureConversation(itemId: string): Promise<string> {
  const row = unwrap(await supabase.rpc('ensure_conversation', { p_item_id: itemId }));
  return row.id;
}

export async function markRead(conversationId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId });
  if (error) throw toAppError(error);
}

/**
 * Live updates for one open thread: new messages, and status changes on the
 * listing's transactions so cards update without a refresh. RLS applies to
 * realtime too, so only rows the user could select are delivered.
 *
 * @returns An unsubscribe function; call it on unmount.
 */
export function subscribeToThread(
  conversationId: string,
  itemId: string,
  handlers: { onMessage: (row: MessageRow) => void; onTransaction: (id: string) => void },
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(uniqueTopic(`thread:${conversationId}`))
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => handlers.onMessage(payload.new as MessageRow),
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'transactions', filter: `item_id=eq.${itemId}` },
      (payload) => handlers.onTransaction((payload.new as { id: string }).id),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Any new message in any of the user's threads, for the tab badge and the
 * chat list. RLS narrows the unfiltered subscription to the user's own.
 */
export function subscribeToInbox(onMessage: () => void): () => void {
  const channel = supabase
    .channel(uniqueTopic('inbox'))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => onMessage())
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
