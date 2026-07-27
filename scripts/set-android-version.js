#!/usr/bin/env node
// Patches app.json's expo.version + expo.android.versionCode from a release tag
// (e.g. "v1.4.2"), so the APK built by .github/workflows/release-apk.yml carries a
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

const version = tag.replace(/^v/, '');
const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
if (!match) {
  console.error(`Tag "${tag}" is not a semver tag (expected vX.Y.Z).`);
  process.exit(1);
}

const [, majorStr, minorStr, patchStr] = match;
const [major, minor, patch] = [majorStr, minorStr, patchStr].map(Number);
const versionCode = major * 1_000_000 + minor * 1_000 + patch;

const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

appJson.expo.version = version;
appJson.expo.android = appJson.expo.android ?? {};
appJson.expo.android.versionCode = versionCode;

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log(`app.json: version=${version} android.versionCode=${versionCode}`);
