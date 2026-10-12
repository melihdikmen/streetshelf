// StreetShelf — sign-in for the app stores' reviewers.
//
// Apple and Google review the app without access to any inbox, so the emailed
// 6-digit code cannot work for them. This function signs in ONE address,
// `REVIEW_EMAIL`, when the caller sends `REVIEW_CODE`, both held in the
// function's secrets. Nobody else can use it: any other address, a wrong code
// and an unset secret all answer the same 401.
//
//   - Wrong guesses are recorded (`review_login_attempts`, 0014) and five in
//     fifteen minutes lock the door with a 429.
//   - To switch it off after review: `npx supabase secrets unset REVIEW_CODE`.
//
// It mints a real session the way the email flow does: an admin-generated
// magic-link token is verified server-side and the session is handed back, so
// the account is an ordinary user under the same RLS as everyone else.

import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_FAILURES = 5;
const WINDOW_MINUTES = 15;

/** A JSON response. */
function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Compares in time that does not depend on where the strings differ. */
function sameSecret(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405, { code: 'unknown' });

  const reviewEmail = Deno.env.get('REVIEW_EMAIL');
  const reviewCode = Deno.env.get('REVIEW_CODE');
  if (!reviewEmail || !reviewCode) return reply(401, { code: 'invalid_otp' });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const code = typeof body?.code === 'string' ? body.code : '';
  // Other addresses are not this function's business and cost no attempt.
  if (email !== reviewEmail.toLowerCase()) return reply(401, { code: 'invalid_otp' });

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await admin
    .from('review_login_attempts')
    .select('id', { count: 'exact', head: true })
    .gte('attempted_at', since);
  if ((count ?? 0) >= MAX_FAILURES) return reply(429, { code: 'rate_limited' });

  if (!sameSecret(code, reviewCode)) {
    await admin.from('review_login_attempts').insert({});
    return reply(401, { code: 'invalid_otp' });
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email: reviewEmail });
  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    console.error('generateLink', linkError);
    return reply(500, { code: 'unknown' });
  }

  const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: verified, error: verifyError } = await anon.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
  if (verifyError || !verified.session) {
    console.error('verifyOtp', verifyError);
    return reply(500, { code: 'unknown' });
  }
  return reply(200, { access_token: verified.session.access_token, refresh_token: verified.session.refresh_token });
});
