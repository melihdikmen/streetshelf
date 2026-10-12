#!/usr/bin/env bash
# Archives and exports the App Store build: build/ios/export/StreetShelf.ipa
set -euo pipefail
cd "$(dirname "$0")/.."

export NODE_ENV=production
export APS_ENVIRONMENT=production

# Shell variables beat every .env file; without this .env.local (the LAN
# Supabase) outranks .env.production and ends up inside the store build.
[ -f .env.production ] || { echo ".env.production is missing (hosted Supabase URL and anon key)"; exit 1; }
set -a; . ./.env.production; set +a
case "$EXPO_PUBLIC_SUPABASE_URL" in https://*) ;; *) echo "Supabase URL is not the hosted https one"; exit 1;; esac

npx expo prebuild --clean -p ios
grep -q '<string>production</string>' ios/StreetShelf/StreetShelf.entitlements \
  || { echo "aps-environment is not production"; exit 1; }

mkdir -p build/ios
cat > build/ios/ExportOptions.plist <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>teamID</key><string>66B7T6P33V</string>
  <key>signingStyle</key><string>automatic</string>
  <key>uploadSymbols</key><true/>
</dict></plist>
PLIST

xcodebuild -workspace ios/StreetShelf.xcworkspace -scheme StreetShelf -configuration Release \
  -destination 'generic/platform=iOS' -archivePath build/ios/StreetShelf.xcarchive \
  -allowProvisioningUpdates archive
xcodebuild -exportArchive -archivePath build/ios/StreetShelf.xcarchive \
  -exportOptionsPlist build/ios/ExportOptions.plist -exportPath build/ios/export -allowProvisioningUpdates
ls -l build/ios/export/*.ipa
