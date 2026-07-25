import { fetchSyncedLyrics, parseLrc } from '@/lib/lyrics';

describe('parseLrc', () => {
  it('parses timestamps and text, sorted by time', () => {
    const lrc = [
      '[ar:Some Artist]',
      '[ti:Some Title]',
      '[00:12.340]Second line',
      '[00:05.00]First line',
      '[00:20.5]Third line',
    ].join('\n');

    expect(parseLrc(lrc).lines).toEqual([
      { timeMs: 5_000, text: 'First line' },
      { timeMs: 12_340, text: 'Second line' },
      { timeMs: 20_500, text: 'Third line' },
    ]);
  });

  it('drops metadata tags and blank lines', () => {
    const lrc = ['[length:03:45]', '[00:01.00]', '[00:02.00]   ', '[00:03.00]Real line'].join('\n');
    expect(parseLrc(lrc).lines).toEqual([{ timeMs: 3_000, text: 'Real line' }]);
  });

  it('expands a shared-text line stacking multiple timestamp tags', () => {
    const lrc = '[00:01.00][00:05.00]Chorus';
    expect(parseLrc(lrc).lines).toEqual([
      { timeMs: 1_000, text: 'Chorus' },
      { timeMs: 5_000, text: 'Chorus' },
    ]);
  });
});

describe('fetchSyncedLyrics', () => {
  const query = { trackName: 'Song', artistName: 'Artist', durationMs: 180_000 };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns parsed lyrics on an exact lrclib match', async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ duration: 180, instrumental: false, syncedLyrics: '[00:01.00]Hello' }),
    }) as unknown as typeof fetch;

    const result = await fetchSyncedLyrics(query);
    expect(result?.lines).toEqual([{ timeMs: 1_000, text: 'Hello' }]);
  });

  it('falls back to search and picks the closest match by duration', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404 }) // /get: no exact match
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { duration: 120, instrumental: false, syncedLyrics: '[00:01.00]Too short' },
          { duration: 181, instrumental: false, syncedLyrics: '[00:01.00]Close enough' },
          { duration: 179, instrumental: true, syncedLyrics: null },
        ],
      }) as unknown as typeof fetch;

    const result = await fetchSyncedLyrics(query);
    expect(result?.lines).toEqual([{ timeMs: 1_000, text: 'Close enough' }]);
  });

  it('returns null when nothing matches', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] }) as unknown as typeof fetch;

    const result = await fetchSyncedLyrics(query);
    expect(result).toBeNull();
  });
});
