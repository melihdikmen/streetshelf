/**
 * Build-time additions to app.json.
 *
 * The Google Maps key for the Android map view comes from the environment
 * (`.env.local` locally, the build secrets on EAS) so it never lands in git.
 * Without it the key is simply absent: the app hides the map button on
 * Android instead of showing a blank map (see `hasAndroidMapsKey`).
 */
module.exports = ({ config }) => {
  const apiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  // Only a yes/no reaches the JS bundle; the key itself goes to the manifest.
  const extra = { ...config.extra, hasAndroidMapsKey: Boolean(apiKey) };
  if (!apiKey) return { ...config, extra };
  return {
    ...config,
    extra,
    android: {
      ...config.android,
      config: {
        ...(config.android && config.android.config),
        googleMaps: { apiKey },
      },
    },
  };
};
