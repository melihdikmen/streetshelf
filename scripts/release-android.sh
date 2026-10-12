#!/usr/bin/env bash
# Builds the signed Play Store bundle: android/app/build/outputs/bundle/release/app-release.aab
set -euo pipefail
cd "$(dirname "$0")/.."

export STREETSHELF_KEYSTORE_PATH="$HOME/.streetshelf/streetshelf-upload.jks"
export STREETSHELF_KEYSTORE_PASSWORD="$(security find-generic-password -a streetshelf -s streetshelf-upload-keystore -w)"
export NODE_ENV=production
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

# Shell variables beat every .env file; without this .env.local (the LAN
# Supabase) outranks .env.production and ends up inside the store build.
[ -f .env.production ] || { echo ".env.production is missing (hosted Supabase URL and anon key)"; exit 1; }
set -a; . ./.env.production; set +a
case "$EXPO_PUBLIC_SUPABASE_URL" in https://*) ;; *) echo "Supabase URL is not the hosted https one"; exit 1;; esac

npx expo prebuild --clean -p android
(cd android && ./gradlew bundleRelease)
ls -l android/app/build/outputs/bundle/release/app-release.aab
