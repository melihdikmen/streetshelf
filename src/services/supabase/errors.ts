/**
 * The closed set of failures the UI knows how to explain. RPCs raise these as
 * `raise exception '<code>'` (see supabase/migrations/0003 and 0005); anything
 * else is mapped to `offline` or `unknown`. Raw Supabase errors and English
 * server text never reach a component.
 */
export const APP_ERROR_CODES = [
  'offline',
  'not_signed_in',
  'invalid_otp',
  'item_not_found',
  'item_unavailable',
  'dates_unavailable',
  'invalid_dates',
  'request_already_open',
  'own_item',
  'blocked',
  'not_your_turn',
  'invalid_transition',
  'owner_only',
  'invite_not_found',
  'not_a_member',
  'already_reviewed',
  'not_finished',
  'upload_failed',
  'unknown',
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    readonly cause?: unknown,
  ) {
    super(code);
    this.name = 'AppError';
  }
}

/**
 * Maps whatever a Supabase call returned or threw onto an `AppError`.
 *
 * @param error A PostgrestError, AuthError, StorageError, or a thrown value.
 * @returns An AppError whose code the UI can translate.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const message = (
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error)
  ).trim();

  const known = APP_ERROR_CODES.find((code) => message === code);
  if (known) return new AppError(known, error);

  const lower = message.toLowerCase();
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('timed out')) {
    return new AppError('offline', error);
  }
  if (lower.includes('token has expired') || lower.includes('invalid otp') || lower.includes('otp')) {
    return new AppError('invalid_otp', error);
  }
  if (lower.includes('jwt') || lower.includes('not authenticated')) {
    return new AppError('not_signed_in', error);
  }
  return new AppError('unknown', error);
}

/**
 * Unwraps a Supabase `{ data, error }` result, throwing an AppError on failure.
 *
 * @param result The awaited query or RPC result.
 * @returns The non-null data.
 */
export function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw toAppError(result.error);
  if (result.data === null) throw new AppError('unknown');
  return result.data;
}
