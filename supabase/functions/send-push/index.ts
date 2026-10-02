// StreetShelf — turn one new message into push notifications.
//
// Called by the `messages_queue_push` trigger (0012) through pg_net, with
// `{ message_id }` and the shared push secret as the bearer. Finds the other
// person in the conversation, writes the text in each of their devices'
// language, sends it through FCM HTTP v1 (Firebase delivers to iOS with the
// APNs key), and forgets devices FCM says are gone or nobody has opened for
// 60 days. A tap opens the thread (`data.url`).
//
// The recipient is derived from the message, never taken from the request:
// a leaked secret can at most repeat a notification about a real message.
//
// The wording follows the chat's own lines (src/i18n/locales, `chat.system`),
// so a notification and the line it announces say the same thing.

import { createClient } from 'npm:@supabase/supabase-js@2';

/** Long texts are cut; the thread has the rest. */
const MAX_BODY = 160;

/**
 * How long a device may go unseen before it is dropped. Every launch with a
 * session refreshes `updated_at`, so an older row is usually a borrowed phone
 * someone closed without signing out, where FCM would keep delivering their
 * notifications to a stranger.
 */
const UNSEEN_DAYS = 60;

const SHARED_SECRET = Deno.env.get('PUSH_SECRET');
/** The whole service account JSON, as Firebase issues it. */
const SERVICE_ACCOUNT = Deno.env.get('FCM_SERVICE_ACCOUNT');

type Locale = 'tr' | 'en';
type Kind = 'TEXT' | 'REQUEST' | 'SYSTEM' | 'PICKUP_PHOTO' | 'RETURN_PHOTO';

const COPY: Record<Locale, {
  request: (name: string) => string;
  system: Record<string, (name: string) => string>;
  pickup: string;
  returned: string;
}> = {
  tr: {
    request: (name) => `${name} bir istek gönderdi.`,
    system: {
      ACCEPTED: (name) => `${name} isteği onayladı. Buluşma için mesajlaşın.`,
      REJECTED: (name) => `${name} isteği reddetti.`,
      CANCELLED: (name) => `${name} işlemi iptal etti.`,
    },
    pickup: 'Teslim edildi.',
    returned: 'İade tamamlandı.',
  },
  en: {
    request: (name) => `${name} sent a request.`,
    system: {
      ACCEPTED: (name) => `${name} accepted the request. Arrange the handover here.`,
      REJECTED: (name) => `${name} declined the request.`,
      CANCELLED: (name) => `${name} cancelled.`,
    },
    pickup: 'Handed over.',
    returned: 'Return complete.',
  },
};

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

/** A short plain-text response; nobody reads it but the logs. */
function reply(status: number, text: string): Response {
  return new Response(text, { status });
}

/** Cuts a text to `MAX_BODY` characters on a whole character. */
function clip(text: string): string {
  const chars = [...text.trim()];
  return chars.length > MAX_BODY ? `${chars.slice(0, MAX_BODY - 1).join('')}…` : chars.join('');
}

/**
 * The notification body for one message in one language, or null when this
 * kind of line is not worth a buzz.
 */
function bodyFor(locale: Locale, kind: Kind, sender: string, text: string | null, note: string | null): string | null {
  const copy = COPY[locale];
  switch (kind) {
    case 'TEXT':
      return text ? clip(text) : null;
    case 'REQUEST':
      return clip(note ? `${copy.request(sender)} “${note}”` : copy.request(sender));
    case 'SYSTEM': {
      const line = text ? copy.system[text] : undefined;
      return line ? line(sender) : null;
    }
    case 'PICKUP_PHOTO':
      return copy.pickup;
    case 'RETURN_PHOTO':
      return copy.returned;
  }
}

/** Compares two secrets without leaking, through timing, how far they matched. */
function secretsMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Base64url without padding, as JWTs want it. */
function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** An OAuth token for FCM, reused while this isolate lives (they last an hour). */
let cachedToken: { value: string; expires: number } | null = null;

/**
 * Trades the service account's key for an access token FCM accepts: a JWT
 * signed with the account's PKCS#8 key, which Web Crypto imports directly.
 */
async function accessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expires - 60 > now) return cachedToken.value;

  const encoder = new TextEncoder();
  const json = (value: unknown) => base64url(encoder.encode(JSON.stringify(value)));
  const unsigned = `${json({ alg: 'RS256', typ: 'JWT' })}.${json({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;

  const pem = account.private_key.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s/g, '');
  const key = await crypto.subtle.importKey(
    'pkcs8',
    Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(unsigned)));

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${base64url(signature)}`,
    }),
  });
  if (!res.ok) throw new Error(`oauth ${res.status}`);
  const { access_token, expires_in } = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: access_token, expires: now + expires_in };
  return access_token;
}

/**
 * Sends one notification. 404 (unregistered) and 400 (malformed) mean FCM
 * will never deliver to that token again, usually an uninstall.
 */
async function sendTo(
  account: ServiceAccount,
  bearer: string,
  token: string,
  title: string,
  body: string,
  url: string,
): Promise<'sent' | 'stale' | 'failed'> {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data: { url },
        android: { priority: 'HIGH', notification: { sound: 'default' } },
        apns: { payload: { aps: { sound: 'default' } } },
      },
    }),
  });
  if (res.ok) return 'sent';
  if (res.status === 404 || res.status === 400) return 'stale';
  console.error('fcm', res.status, await res.text());
  return 'failed';
}

Deno.serve(async (req) => {
  if (!SHARED_SECRET || !SERVICE_ACCOUNT) return reply(500, 'not configured');
  const presented = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!secretsMatch(presented, SHARED_SECRET)) return reply(401, 'unauthorized');

  const payload: unknown = await req.json().catch(() => null);
  const messageId =
    typeof payload === 'object' && payload !== null && 'message_id' in payload ? String(payload.message_id) : '';
  if (!messageId) return reply(400, 'message_id required');

  const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: message } = await db
    .from('messages')
    .select('id, conversation_id, sender_id, kind, body, created_at, conversations(owner_id, requester_id, items(title))')
    .eq('id', messageId)
    .maybeSingle();
  if (!message?.sender_id || !message.conversations) return reply(200, 'nothing to send');

  const conversation = message.conversations;
  const recipientId =
    conversation.owner_id === message.sender_id ? conversation.requester_id : conversation.owner_id;

  // Abandoned devices go before the send, so they stop receiving on the
  // first notification after going stale, not the second.
  const cutoff = new Date(Date.now() - UNSEEN_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await db.from('push_tokens').delete().eq('user_id', recipientId).lt('updated_at', cutoff);

  // A blocked sender cannot write anyway; this covers a block made after the
  // message was queued.
  const [{ data: tokens }, { data: sender }, { count: blocked }, { data: note }] = await Promise.all([
    db.from('push_tokens').select('token, locale').eq('user_id', recipientId),
    db.from('profiles').select('display_name').eq('id', message.sender_id).maybeSingle(),
    db
      .from('blocks')
      .select('blocker_id', { count: 'exact', head: true })
      .eq('blocker_id', recipientId)
      .eq('blocked_id', message.sender_id),
    // A request's note shares its card's timestamp (see 0012).
    message.kind === 'REQUEST'
      ? db
          .from('messages')
          .select('body')
          .eq('conversation_id', message.conversation_id)
          .eq('kind', 'TEXT')
          .eq('created_at', message.created_at)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!tokens?.length || blocked) return reply(200, 'nothing to send');

  const senderName = sender?.display_name ?? '';
  const itemTitle = conversation.items?.title ?? 'StreetShelf';
  const kind = message.kind as Kind;

  const account = JSON.parse(SERVICE_ACCOUNT) as ServiceAccount;
  const bearer = await accessToken(account);
  const url = `/chat/${message.conversation_id}`;

  const stale: string[] = [];
  let sent = 0;
  for (const { token, locale } of tokens) {
    const lang: Locale = locale === 'en' ? 'en' : 'tr';
    const body = bodyFor(lang, kind, senderName, message.body, note?.body ?? null);
    if (!body) continue;
    // A text reads as a chat ("Ayşe K."), every card as news about the item.
    const title = kind === 'TEXT' ? senderName : itemTitle;
    const result = await sendTo(account, bearer, token, title, body, url);
    if (result === 'sent') sent += 1;
    if (result === 'stale') stale.push(token);
  }
  if (stale.length) await db.from('push_tokens').delete().in('token', stale);

  return reply(200, `sent ${sent}, pruned ${stale.length}`);
});
