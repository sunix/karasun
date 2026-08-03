const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Adds a "release" signingConfig to android/app/build.gradle that reads a keystore
 * from ANDROID_KEYSTORE_PATH / ANDROID_KEYSTORE_PASSWORD / ANDROID_KEY_ALIAS env vars
 * (set by .github/workflows/release-apk.yml) when present, falling back to Expo's
 * debug keystore otherwise.
 *
 * Why: Expo's default template signs release builds with the debug keystore, whose
 * private key is public (bundled in every Expo project). That's fine for one-off
 * manual test installs (pr-preview-apk.yml), but not for release-apk.yml's builds,
 * which the app's self-updater (src/lib/appUpdates.ts) downloads and installs with
 * implicit trust-on-first-use — anyone could forge a same-signature "update" using
 * that same public key.
 *
 * Reuses the store password as the key password rather than reading a separate
 * ANDROID_KEY_PASSWORD: modern `keytool` defaults to PKCS12 keystores, which don't
 * support a key password different from the store password (it silently ignores
 * -keypass at generation time) — passing a different value here just fails signing
 * with a "Given final block not properly padded" error.
 *
 * Uses `=` assignment (not the classic Groovy `propertyName value` setter-call
 * style) for every signingConfig property: with this project's AGP/Gradle versions,
 * the setter-call style silently failed to stick for `keyPassword` specifically
 * (Gradle reported "missing required property keyPassword" even though it was
 * assigned the exact same value as storePassword, which worked) — `keyPassword` is
 * apparently backed by a Gradle `Property<String>`, which needs a real assignment.
 */
module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    const contents = config.modResults.contents;

    const debugConfigBlock = `        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }`;

    if (!contents.includes(debugConfigBlock)) {
      throw new Error(
        'withAndroidReleaseSigning: expected debug signingConfig block not found in ' +
          'android/app/build.gradle — Expo\'s native template may have changed, update this plugin.'
      );
    }

    const releaseConfigBlock = `${debugConfigBlock}
        release {
            storeFile = file(System.getenv("ANDROID_KEYSTORE_PATH") ?: 'debug.keystore')
            storePassword = System.getenv("ANDROID_KEYSTORE_PATH") ? System.getenv("ANDROID_KEYSTORE_PASSWORD") : 'android'
            keyAlias = System.getenv("ANDROID_KEYSTORE_PATH") ? System.getenv("ANDROID_KEY_ALIAS") : 'androiddebugkey'
            keyPassword = System.getenv("ANDROID_KEYSTORE_PATH") ? System.getenv("ANDROID_KEYSTORE_PASSWORD") : 'android'
        }`;

    const releaseSigningLine = `            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`;

    if (!contents.includes(releaseSigningLine)) {
      throw new Error(
        'withAndroidReleaseSigning: expected release buildType signingConfig line not found in ' +
          'android/app/build.gradle — Expo\'s native template may have changed, update this plugin.'
      );
    }

    const updatedReleaseSigningLine = `            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.release`;

    config.modResults.contents = contents
      .replace(debugConfigBlock, releaseConfigBlock)
      .replace(releaseSigningLine, updatedReleaseSigningLine);

    return config;
  });
};
