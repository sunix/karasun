#!/usr/bin/env node
// Patches app.json's expo.version + expo.android.versionCode from a release tag
// (e.g. "v1.4.2", or "karasun-v1.4.2" if release-please's component prefix is ever
// re-enabled), so the APK built by .github/workflows/release-apk.yml carries a
// versionCode that strictly increases across releases — required for Android to
// treat a sideloaded APK as an upgrade rather than a conflicting/older install.
'use strict';

const fs = require('fs');
const path = require('path');

const tag = process.argv[2];
if (!tag) {
  console.error('Usage: node scripts/set-android-version.js <tag>');
  process.exit(1);
}

// Matches the semver anywhere in the tag, regardless of prefix ("v1.4.2",
// "karasun-v1.4.2", etc.) rather than requiring it at the very start.
const match = tag.match(/(\d+)\.(\d+)\.(\d+)/);
if (!match) {
  console.error(`Tag "${tag}" has no semver in it (expected e.g. vX.Y.Z).`);
  process.exit(1);
}

const [, majorStr, minorStr, patchStr] = match;
const [major, minor, patch] = [majorStr, minorStr, patchStr].map(Number);
const version = `${major}.${minor}.${patch}`;
const versionCode = major * 1_000_000 + minor * 1_000 + patch;

const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

appJson.expo.version = version;
appJson.expo.android = appJson.expo.android ?? {};
appJson.expo.android.versionCode = versionCode;

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log(`app.json: version=${version} android.versionCode=${versionCode}`);
