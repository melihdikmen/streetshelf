import type { Transaction } from '../../types/domain';
import { supabase } from './client';
import { toAppError, unwrap } from './errors';
import { toTransaction, type TransactionRow } from './mappers';
import { randomName, signedHandoverUrls, uploadPhoto } from './storage';

const TX_COLUMNS =
  'id, item_id, owner_id, borrower_id, initiated_by, status, start_date, end_date, total_amount, pickup_photo_path, return_photo_path';

/** Resolves handover photos for a batch of rows and maps them. */
async function mapRows(rows: TransactionRow[]): Promise<Transaction[]> {
  const paths = rows.flatMap((r) => [r.pickup_photo_path, r.return_photo_path]).filter((p): p is string => !!p);
  const urls = await signedHandoverUrls(paths);
  return rows.map((row) => toTransaction(row, urls));
}

/** Everything the caller gives or receives; RLS limits it to their own. */
export async function getMyTransactions(): Promise<Transaction[]> {
  const rows = unwrap(await supabase.from('transactions').select(TX_COLUMNS).order('created_at', { ascending: false }).limit(200));
  return mapRows(rows);
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const rows = unwrap(await supabase.from('transactions').select(TX_COLUMNS).eq('id', id));
  return rows[0] ? (await mapRows(rows))[0] : null;
}

/**
 * Opens a request on a listing. The RPC checks dates against closed days and
 * accepted handovers, opens the thread and drops the note plus the card in.
 *
 * @returns The new transaction's id.
 */
export async function requestTransaction(itemId: string, startDate: string, endDate: string, note?: string): Promise<string> {
  const row = unwrap(
    await supabase.rpc('request_transaction', {
      p_item_id: itemId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_message: note?.trim() || undefined,
    }),
  );
  return row.id;
}

export async function respondTransaction(id: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('respond_transaction', { p_transaction_id: id, p_accept: accept });
  if (error) throw toAppError(error);
}

export async function cancelTransaction(id: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_transaction', { p_transaction_id: id });
  if (error) throw toAppError(error);
}

/**
 * Uploads the handover or return photo, then records it. The path shape is
 * what both the storage policy and the RPC check:
 * `transactions/<id>/<kind>-<random>.jpg`.
 */
export async function confirmWithPhoto(id: string, kind: 'pickup' | 'return', localUri: string): Promise<void> {
  const path = `transactions/${id}/${kind}-${randomName()}`;
  await uploadPhoto('handover-photos', path, localUri);
  const { error } = await supabase.rpc(kind === 'pickup' ? 'confirm_pickup' : 'confirm_return', {
    p_transaction_id: id,
    p_photo_path: path,
  });
  if (error) throw toAppError(error);
}
