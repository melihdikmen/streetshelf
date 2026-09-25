/**
 * Development-only shortcuts. Both stay `null` in commits.
 *
 * DEV_ROUTE: a path such as `/settings`; save and fast refresh jumps there.
 * DEV_EMAIL: a seeded address such as `melih@neighborlend.test`; on launch
 * without a session the app asks for a code and reads it back from the local
 * Mailpit inbox. Only works against the local stack.
 */
export const DEV_ROUTE: string | null = null;
export const DEV_EMAIL: string | null = null;
