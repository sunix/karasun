import { checkForUpdate, isNewerVersion, parseSemver } from '@/lib/appUpdates';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.2.0' } },
}));

describe('parseSemver', () => {
  it('parses a "vX.Y.Z" tag', () => {
    expect(parseSemver('v1.2.3')).toEqual([1, 2, 3]);
  });

  it('parses a plain "X.Y.Z" string', () => {
    expect(parseSemver('1.2.3')).toEqual([1, 2, 3]);
  });

  it('returns null for a malformed version', () => {
    expect(parseSemver('not-a-version')).toBeNull();
  });

  it('parses a component-prefixed tag (e.g. release-please with include-component-in-tag)', () => {
    expect(parseSemver('karasun-v1.2.3')).toEqual([1, 2, 3]);
  });
});

describe('isNewerVersion', () => {
  it('detects a newer patch/minor/major', () => {
    expect(isNewerVersion('v1.2.4', '1.2.3')).toBe(true);
    expect(isNewerVersion('v1.3.0', '1.2.9')).toBe(true);
    expect(isNewerVersion('v2.0.0', '1.9.9')).toBe(true);
  });

  it('returns false for an equal or older version', () => {
    expect(isNewerVersion('v1.2.3', '1.2.3')).toBe(false);
    expect(isNewerVersion('v1.2.2', '1.2.3')).toBe(false);
  });

  it('returns false when either version is malformed', () => {
    expect(isNewerVersion('garbage', '1.2.3')).toBe(false);
  });
});

describe('checkForUpdate', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns update info when a newer release with an apk asset exists', async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tag_name: 'v1.3.0',
        html_url: 'https://github.com/sunix/karasun/releases/tag/v1.3.0',
        body: 'Notes',
        assets: [{ name: 'app-release.apk', browser_download_url: 'https://example.com/app-release.apk' }],
      }),
    }) as unknown as typeof fetch;

    const result = await checkForUpdate();
    expect(result).toEqual({
      version: 'v1.3.0',
      apkUrl: 'https://example.com/app-release.apk',
      releaseUrl: 'https://github.com/sunix/karasun/releases/tag/v1.3.0',
      notes: 'Notes',
    });
  });

  it('returns null when the latest release is not newer', async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tag_name: 'v1.2.0',
        assets: [{ name: 'app-release.apk', browser_download_url: 'https://example.com/app-release.apk' }],
      }),
    }) as unknown as typeof fetch;

    expect(await checkForUpdate()).toBeNull();
  });

  it('returns null when the newer release has no apk asset', async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tag_name: 'v1.3.0', assets: [] }),
    }) as unknown as typeof fetch;

    expect(await checkForUpdate()).toBeNull();
  });

  it('returns null when the GitHub API call fails', async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({ ok: false }) as unknown as typeof fetch;

    expect(await checkForUpdate()).toBeNull();
  });
});
