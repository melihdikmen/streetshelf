import { supabase } from './client';
import { toAppError } from './errors';

/**
 * Registers this device's Expo push token for the signed-in user, or moves it
 * here from whoever used the phone before. `locale` is the app's language, so
 * the server writes the notification in it.
 */
export async function registerPushToken(token: string, platform: 'ios' | 'android', locale: string): Promise<void> {
  const { error } = await supabase.rpc('register_push_token', { p_token: token, p_platform: platform, p_locale: locale });
  if (error) throw toAppError(error);
}

/** Stops this device receiving the signed-in user's notifications. */
export async function unregisterPushToken(token: string): Promise<void> {
  const { error } = await supabase.rpc('unregister_push_token', { p_token: token });
  if (error) throw toAppError(error);
}
