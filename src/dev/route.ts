/**
 * Development-only shortcuts. Both stay `null` in commits.
 *
 * DEV_ROUTE: a path such as `/settings`; save and fast refresh jumps there.
 * DEV_EMAIL: a seeded address such as `melih@streetshelf.test`; on launch
 * without a session the app asks for a code and reads it back from the local
 * Mailpit inbox. Only works against the local stack.
 * DEV_OFFLINE: pretend the device has no internet, to see the offline bar
 * without turning off the Mac's Wi-Fi. Read at launch; stays `false`.
 */
export const DEV_ROUTE: string | null = null;
export const DEV_EMAIL: string | null = null;
export const DEV_OFFLINE = false;
