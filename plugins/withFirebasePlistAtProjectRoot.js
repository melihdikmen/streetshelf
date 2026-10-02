const fs = require('fs');
const path = require('path');

const { withDangerousMod } = require('expo/config-plugins');

/**
 * Reconciles two RN Firebase Expo plugins that disagree on where the iOS
 * Firebase config lives.
 *
 * `@react-native-firebase/app` writes GoogleService-Info.plist into
 * ios/<AppName>/, while the Crashlytics build phase reads
 * "${PROJECT_DIR}/GoogleService-Info.plist" — the ios/ directory itself. The
 * phase runs under `set -e`, so the mismatch fails the whole build.
 *
 * Copying rather than patching the build phase: the copy is inert (it is not a
 * target resource — the real bundled plist stays in ios/<AppName>/), and it
 * keeps us out of pbxproj surgery that would break when either plugin changes.
 *
 * Remove once the plugins agree upstream.
 */
module.exports = function withFirebasePlistAtProjectRoot(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      // Read from the source file in the project root rather than from
      // ios/<AppName>/. Mod execution order relative to the RN Firebase plugin
      // is not guaranteed, and this file always exists before prebuild starts.
      const iosRoot = cfg.modRequest.platformProjectRoot;
      const configured = cfg.ios?.googleServicesFile ?? './GoogleService-Info.plist';
      const source = path.resolve(cfg.modRequest.projectRoot, configured);
      const destination = path.join(iosRoot, 'GoogleService-Info.plist');

      if (fs.existsSync(source)) {
        fs.copyFileSync(source, destination);
      } else {
        console.warn(
          `[withFirebasePlistAtProjectRoot] expected plist at ${source} — ` +
            'Crashlytics dSYM upload will fail until it exists.',
        );
      }
      return cfg;
    },
  ]);
};
