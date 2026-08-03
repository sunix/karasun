#!/usr/bin/env node
// Overrides app.json's name/scheme/android.package for PR-preview builds
// (.github/workflows/pr-preview-apk.yml) so the preview APK installs as a
// completely separate app from the real one:
// - a different android.package means Android never treats it as a
//   conflicting/incompatible update against the real app's install
// - a different scheme avoids Spotify's OAuth redirect being ambiguous
//   between the two apps when both are installed at once
// - a different name makes the two apps easy to tell apart on the home screen
'use strict';

const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

const baseScheme = Array.isArray(appJson.expo.scheme) ? appJson.expo.scheme[0] : appJson.expo.scheme;
const basePackage = appJson.expo.android?.package;

if (!baseScheme || !basePackage) {
  console.error('set-preview-app-id.js: expo.scheme or expo.android.package missing from app.json.');
  process.exit(1);
}

appJson.expo.name = `${appJson.expo.name} Preview`;
appJson.expo.scheme = `${baseScheme}-preview`;
appJson.expo.android.package = `${basePackage}.preview`;

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log(
  `app.json: name="${appJson.expo.name}" package=${appJson.expo.android.package} scheme=${appJson.expo.scheme}`
);
