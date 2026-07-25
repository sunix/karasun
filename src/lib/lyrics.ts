import { LyricLine, SyncedLyrics } from '@/types/lyrics';

const LRCLIB_BASE = 'https://lrclib.net/api';

// Matches one or more stacked LRC timestamp tags at the start of a line, e.g.
// "[00:12.340]text" or "[00:01.00][00:05.00]text" (a rare but valid shared-text form).
const LRC_TIME_TAG = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

/** Parses raw LRC text into time-ordered lyric lines, dropping metadata tags and blank lines. */
export function parseLrc(lrcText: string): SyncedLyrics {
  const lines: LyricLine[] = [];

  for (const rawLine of lrcText.split(/\r?\n/)) {
    const tags = [...rawLine.matchAll(LRC_TIME_TAG)];
    if (tags.length === 0) continue;

    const text = rawLine.replace(LRC_TIME_TAG, '').trim();
    if (!text) continue;

    for (const tag of tags) {
      const minutes = Number(tag[1]);
      const seconds = Number(tag[2]);
      const fraction = tag[3] ?? '0';
      const fractionMs = Number(fraction.padEnd(3, '0').slice(0, 3));
      const timeMs = minutes * 60_000 + seconds * 1_000 + fractionMs;
      lines.push({ timeMs, text });
    }
  }

  lines.sort((a, b) => a.timeMs - b.timeMs);
  return { lines };
}

export interface LyricsQuery {
  trackName: string;
  artistName: string;
  albumName?: string;
  durationMs: number;
}

interface LrclibRecord {
  duration: number;
  instrumental: boolean;
  syncedLyrics: string | null;
}

async function getExactMatch(query: LyricsQuery): Promise<LrclibRecord | null> {
  const params = new URLSearchParams({
    track_name: query.trackName,
    artist_name: query.artistName,
    duration: String(Math.round(query.durationMs / 1000)),
  });
  if (query.albumName) params.set('album_name', query.albumName);

  const response = await fetch(`${LRCLIB_BASE}/get?${params.toString()}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`lrclib.net a répondu ${response.status}`);
  return response.json();
}

async function searchCandidates(query: LyricsQuery): Promise<LrclibRecord[]> {
  const params = new URLSearchParams({
    track_name: query.trackName,
    artist_name: query.artistName,
  });
  const response = await fetch(`${LRCLIB_BASE}/search?${params.toString()}`);
  if (!response.ok) return [];
  return response.json();
}

function pickClosestByDuration(records: LrclibRecord[], targetMs: number): LrclibRecord | null {
  const withSync = records.filter((r) => !r.instrumental && r.syncedLyrics);
  if (withSync.length === 0) return null;
  return withSync.reduce((best, current) => {
    const bestDiff = Math.abs(best.duration * 1000 - targetMs);
    const currentDiff = Math.abs(current.duration * 1000 - targetMs);
    return currentDiff < bestDiff ? current : best;
  });
}

/** Fetches synced lyrics for a track from lrclib.net, or null if none are available. */
export async function fetchSyncedLyrics(query: LyricsQuery): Promise<SyncedLyrics | null> {
  const exact = await getExactMatch(query);
  if (exact?.syncedLyrics) {
    return parseLrc(exact.syncedLyrics);
  }

  const candidates = await searchCandidates(query);
  const best = pickClosestByDuration(candidates, query.durationMs);
  if (best?.syncedLyrics) {
    return parseLrc(best.syncedLyrics);
  }

  return null;
}
