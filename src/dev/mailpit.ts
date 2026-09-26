import { isLocalBackend } from '../services/supabase/client';

/**
 * Development-only access to the local Mailpit inbox, where the local
 * Supabase stack delivers sign-in codes instead of sending real email.
 */

/** The Mailpit API sits next to the local Supabase API (54521 → 54524). */
export function mailpitBase(): string | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  return url && /:54521$/.test(url) ? url.replace(/:54521$/, ':54524') : null;
}

/** Whether dev sign-in shortcuts can work: a dev build talking to the local stack. */
export function devSignInAvailable(): boolean {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  return __DEV__ && !!url && isLocalBackend(url) && mailpitBase() !== null;
}

interface MailpitMessage {
  ID: string;
  Created: string;
}

/**
 * Reads the sign-in code mailed to an address after `since`, retrying while
 * the mail is in flight.
 *
 * Only mail newer than `since` counts: an address that signed in before
 * already has codes in the inbox, and picking one of those up would fail
 * verification with an expired code.
 *
 * @param since Epoch milliseconds taken just before the code was requested.
 */
export async function readCode(email: string, since: number): Promise<string> {
  const base = mailpitBase();
  if (!base) throw new Error('Mailpit is only reachable against the local stack');
  // A second of slack for clock drift between the phone and the Mac.
  const after = since - 1000;
  for (let attempt = 0; attempt < 12; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const search = await fetch(`${base}/api/v1/search?limit=1&query=${encodeURIComponent(`to:"${email}"`)}`);
    const latest = ((await search.json()) as { messages?: MailpitMessage[] }).messages?.[0];
    if (!latest || Date.parse(latest.Created) < after) continue;
    const message = (await (await fetch(`${base}/api/v1/message/${latest.ID}`)).json()) as { Text?: string };
    const code = message.Text?.match(/\b(\d{6})\b/)?.[1];
    if (code) return code;
  }
  throw new Error('No code arrived');
}
