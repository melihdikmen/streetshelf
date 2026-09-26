import { supabase } from './client';
import { toAppError, unwrap } from './errors';

export async function getBlockedIds(): Promise<string[]> {
  const rows = unwrap(await supabase.from('blocks').select('blocked_id'));
  return rows.map((r) => r.blocked_id);
}

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase.from('blocks').upsert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) throw toAppError(error);
}

/** Lifts a block the caller placed. RLS ("blocks: own") limits it to their own rows. */
export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase.from('blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);
  if (error) throw toAppError(error);
}

export interface ReportInput {
  itemId?: string;
  userId?: string;
  reason: string;
  details?: string;
}

/** Files a report. Reason and detail are stored as one line of text. */
export async function report(reporterId: string, input: ReportInput): Promise<void> {
  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    item_id: input.itemId ?? null,
    user_id: input.userId ?? null,
    reason: [input.reason, input.details?.trim()].filter(Boolean).join(': '),
  });
  if (error) throw toAppError(error);
}
