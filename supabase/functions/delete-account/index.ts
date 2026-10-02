// StreetShelf — delete the signed-in user's account, for real.
//
// Called by the app from Settings with the user's own JWT. Runs with the
// service role because deleting an auth user and other people's handover
// photos is beyond what any client may do. Order matters:
//
//   1. `prepare_account_deletion` refuses while a handover is in progress,
//      hands the user's groups on, and lists their stored files.
//   2. The files are removed through the Storage API (SQL cannot delete them).
//   3. The auth user is deleted; the database cascades the rest (0011).
//
// Files go before the account so that a failure part-way leaves an account
// the user can retry deleting, never an orphaned photo nobody can reach.

import { createClient } from 'npm:@supabase/supabase-js@2';

/** Removal is batched; the Storage API takes at most 1000 paths per call. */
const REMOVE_BATCH = 1000;

/** A JSON response with the `code` the app maps onto `errors.codes.*`. */
function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405, { code: 'unknown' });

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return reply(401, { code: 'not_signed_in' });

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // The user id comes from the verified token, never from the request body:
  // nobody deletes an account but their own.
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return reply(401, { code: 'not_signed_in' });
  const userId = auth.user.id;

  const { data: files, error: prepareError } = await admin.rpc('prepare_account_deletion', { p_user: userId });
  if (prepareError) {
    const code = prepareError.message === 'active_transactions' ? 'active_transactions' : 'unknown';
    if (code === 'unknown') console.error('prepare_account_deletion', prepareError);
    return reply(code === 'active_transactions' ? 409 : 500, { code });
  }

  const byBucket = new Map<string, string[]>();
  for (const { bucket, path } of files ?? []) {
    byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), path]);
  }
  for (const [bucket, paths] of byBucket) {
    for (let i = 0; i < paths.length; i += REMOVE_BATCH) {
      const { error } = await admin.storage.from(bucket).remove(paths.slice(i, i + REMOVE_BATCH));
      if (error) {
        console.error('storage remove', bucket, error);
        return reply(500, { code: 'unknown' });
      }
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error('deleteUser', deleteError);
    return reply(500, { code: 'unknown' });
  }

  return reply(200, { ok: true });
});
