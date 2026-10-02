/**
 * Build-time additions to app.json.
 *
 * The Google Maps key for the Android map view comes from the environment
 * (`.env.local` locally, the build secrets on EAS) so it never lands in git.
 * Without it the key is simply absent: the app hides the map button on
 * Android instead of showing a blank map (see `hasAndroidMapsKey`).
 *
 * `aps-environment` decides which APNs environment iOS issues a push token
 * from. A store build carrying `development` gets sandbox tokens and every
 * notification fails silently; a local build carrying `production` fails the
 * same way the other way round. So it is read at `expo prebuild`, defaulting
 * to development; a release goes
 * `APS_ENVIRONMENT=production npx expo prebuild --clean -p ios`.
 * The Firebase messaging plugin does not write this entitlement itself.
 */
module.exports = ({ config }) => {
  const apiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  // Only a yes/no reaches the JS bundle; the key itself goes to the manifest.
  const extra = { ...config.extra, hasAndroidMapsKey: Boolean(apiKey) };
  const ios = {
    ...config.ios,
    entitlements: {
      ...(config.ios && config.ios.entitlements),
      'aps-environment': process.env.APS_ENVIRONMENT === 'production' ? 'production' : 'development',
    },
  };
  if (!apiKey) return { ...config, extra, ios };
  return {
    ...config,
    extra,
    ios,
    android: {
      ...config.android,
      config: {
        ...(config.android && config.android.config),
        googleMaps: { apiKey },
      },
    },
  };
};
