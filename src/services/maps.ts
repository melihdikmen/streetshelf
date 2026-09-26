import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Whether this build can draw the map. iOS uses Apple Maps and needs nothing;
 * Android uses Google Maps, which needs a key baked in at build time
 * (GOOGLE_MAPS_ANDROID_API_KEY, see app.config.js). Without one the map would
 * render blank, so the map toggle is hidden instead.
 */
export function mapsAvailable(): boolean {
  if (Platform.OS !== 'android') return true;
  return Constants.expoConfig?.extra?.hasAndroidMapsKey === true;
}
