import Constants from 'expo-constants';

const GITHUB_REPO = 'sunix/karasun';

export interface AvailableUpdate {
  version: string;
  apkUrl: string;
  releaseUrl: string;
  notes: string | null;
}

/** Parses a "vX.Y.Z" or "X.Y.Z" string into [major, minor, patch], or null if malformed. */
export function parseSemver(version: string): [number, number, number] | null {
  const match = version.replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function isNewerVersion(candidate: string, current: string): boolean {
  const a = parseSemver(candidate);
  const b = parseSemver(current);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

/**
 * Checks the repo's latest GitHub Release against the running app version
 * (from app.json's expo.version, baked in at build time). Returns the APK download
 * URL when a newer release with an .apk asset is available, or null otherwise.
 */
export async function checkForUpdate(): Promise<AvailableUpdate | null> {
  const currentVersion = Constants.expoConfig?.version;
  if (!currentVersion) return null;

  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
  if (!response.ok) return null;
  const release = await response.json();

  const latestVersion: string | undefined = release?.tag_name;
  if (!latestVersion || !isNewerVersion(latestVersion, currentVersion)) return null;

  const apkAsset = (release.assets ?? []).find((asset: any) => asset.name?.endsWith('.apk'));
  if (!apkAsset) return null;

  return {
    version: latestVersion,
    apkUrl: apkAsset.browser_download_url,
    releaseUrl: release.html_url,
    notes: release.body ?? null,
  };
}
