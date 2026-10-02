import { FunctionsHttpError, type Session } from '@supabase/supabase-js';

import { supabase } from './client';
import { toAppError } from './errors';

/** Lower-cased, trimmed address; GoTrue compares emails case-sensitively. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Emails a 6-digit sign-in code. Email is the only sign-in method: it costs
 * nothing per login, where SMS would bill every one. A new address becomes an
 * account on verification; there is no separate sign-up. Locally the mail
 * lands in Mailpit.
 */
export async function sendOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: normaliseEmail(email),
    options: { shouldCreateUser: true },
  });
  if (error) throw toAppError(error);
}

/**
 * Verifies the code and signs in.
 *
 * @returns The new session.
 */
export async function verifyOtp(email: string, code: string): Promise<Session> {
  const { data, error } = await supabase.auth.verifyOtp({ email: normaliseEmail(email), token: code, type: 'email' });
  if (error || !data.session) throw toAppError(error ?? 'invalid_otp');
  return data.session;
}

/** The persisted session, if any; read from MMKV synchronously under the hood. */
export async function currentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Whether the signed-in user finished onboarding, asked of the server.
 *
 * Not read from the cached session: that copy of the user is from the last
 * token refresh, so a flag set elsewhere (another device, the seed, an admin)
 * would stay invisible until the token rotates.
 *
 * @param fallback Used when the server cannot be reached.
 */
export async function isOnboarded(fallback: boolean): Promise<boolean> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return fallback;
  return data.user.user_metadata?.onboarded === true;
}

/**
 * Marks onboarding done on the auth user, so a returning user skips it even
 * on a fresh install. Kept in user metadata rather than a profile column
 * because it is about the account, not about what neighbours see.
 */
export async function markOnboarded(): Promise<void> {
  const { error } = await supabase.auth.updateUser({ data: { onboarded: true } });
  if (error) throw toAppError(error);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw toAppError(error);
}

/**
 * Permanently deletes the signed-in account through the `delete-account` edge
 * function (a client cannot delete an auth user), then drops the now-dead
 * session from this device. Refused with `active_transactions` while a
 * handover is in progress.
 */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) {
    // The function answers `{ code }`; a network failure has no response body.
    const body: unknown = error instanceof FunctionsHttpError ? await error.context.json().catch(() => null) : null;
    const code = typeof body === 'object' && body !== null && 'code' in body ? String(body.code) : error;
    throw toAppError(code);
  }
  // `local`: the user no longer exists, so a server-side sign-out would fail.
  await supabase.auth.signOut({ scope: 'local' });
}

/**
 * Subscribes to sign-in, sign-out and token refresh.
 *
 * @returns An unsubscribe function.
 */
export function onAuthStateChange(listener: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => listener(session));
  return () => data.subscription.unsubscribe();
}
