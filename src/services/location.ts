import * as Location from 'expo-location';

import type { Origin } from './supabase/items';

/** Park Oran, Ankara. Used until the first fix, or when permission is denied. */
export const FALLBACK_ORIGIN: Origin = { latitude: 39.8676, longitude: 32.8386 };

/**
 * Best available position without blocking the UI: the last known fix if the
 * OS has one (instant), otherwise a balanced-accuracy fix. Neighbourhood
 * precision is all the feed needs; high accuracy would cost seconds and
 * battery for nothing.
 *
 * @returns The position, or null when permission is not granted.
 */
export async function currentOrigin(): Promise<Origin | null> {
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) return null;
  const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 });
  if (last) return { latitude: last.coords.latitude, longitude: last.coords.longitude };
  const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { latitude: fix.coords.latitude, longitude: fix.coords.longitude };
}

/** @returns Whether the user granted foreground location. */
export async function requestLocation(): Promise<boolean> {
  const result = await Location.requestForegroundPermissionsAsync();
  return result.granted;
}
