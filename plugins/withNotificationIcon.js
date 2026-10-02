const fs = require('fs');
const path = require('path');

const { AndroidConfig, withAndroidColors, withDangerousMod } = require('expo/config-plugins');

/**
 * Supplies the Android drawable that the Firebase messaging plugin points at
 * but does not create.
 *
 * `@react-native-firebase/messaging` writes a manifest entry naming
 * `@drawable/notification_icon` and leaves the resource itself to Expo, which
 * used to generate it from `expo.notification.icon`. That field was deprecated
 * in SDK 54 and is gone from the config schema by 57, and the other source the
 * plugin reads is the `expo-notifications` plugin — which this project
 * deliberately does not use, because it fights Firebase over the APNs
 * delegate on iOS. So nothing writes the drawable, and the manifest points at
 * a resource that does not exist.
 *
 * Why it matters: with no icon set, Android falls back to the launcher icon
 * and masks it to a silhouette. The launcher icon is a white house on leaf green,
 * so every notification arrives as a solid white square.
 *
 * The same file goes into every density rather than one per density. It is a
 * 96px white silhouette — 24dp at xxxhdpi — and Android downscales a
 * single-colour shape cleanly, so per-density copies would be five identical
 * decisions to keep in step for no visible gain.
 *
 * The colour has the same problem and the same fix. The messaging plugin also
 * writes `@color/notification_icon_color` into the manifest without defining
 * it, which fails the build outright at resource linking — louder than the
 * missing drawable, but the same omission.
 */
const DENSITIES = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

/** Must match the name the messaging plugin writes into the manifest. */
const COLOR_NAME = 'notification_icon_color';

/**
 * Copies `assets/notification-icon.png` into the Android drawable folders.
 *
 * @param config The Expo config being built.
 * @returns The config, with the copy scheduled for prebuild.
 */
module.exports = function withNotificationIcon(config) {
  const colour = config.plugins
    ?.flatMap((plugin) =>
      Array.isArray(plugin) && plugin[0] === '@react-native-firebase/messaging' ? [plugin[1]] : [],
    )
    .find((props) => props?.android?.notificationColor)?.android?.notificationColor;

  const withColour = colour
    ? withAndroidColors(config, (modConfig) => {
        modConfig.modResults = AndroidConfig.Colors.assignColorValue(modConfig.modResults, {
          name: COLOR_NAME,
          value: colour,
        });
        return modConfig;
      })
    : config;

  return withDangerousMod(withColour, [
    'android',
    async (modConfig) => {
      const source = path.join(modConfig.modRequest.projectRoot, 'assets', 'notification-icon.png');

      // Fail loudly rather than produce a build whose notifications are a
      // white square: the symptom appears only on a real device, long after
      // the build that caused it.
      if (!fs.existsSync(source)) {
        throw new Error(
          'assets/notification-icon.png is missing: a 96px white silhouette on transparency (sips -Z 96 assets/android-icon-monochrome.png --out assets/notification-icon.png).',
        );
      }

      const res = path.join(modConfig.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');
      for (const density of DENSITIES) {
        const dir = path.join(res, `drawable-${density}`);
        fs.mkdirSync(dir, { recursive: true });
        fs.copyFileSync(source, path.join(dir, 'notification_icon.png'));
      }

      return modConfig;
    },
  ]);
};
