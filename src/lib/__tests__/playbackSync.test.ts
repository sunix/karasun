import { extrapolatePositionMs, findActiveLineIndex } from '@/lib/playbackSync';
import { PlaybackState } from '@/types/spotify';

function makePlayback(overrides: Partial<PlaybackState>): PlaybackState {
  return {
    isPlaying: true,
    progressMs: 0,
    track: null,
    device: null,
    fetchedAt: 0,
    ...overrides,
  };
}

describe('extrapolatePositionMs', () => {
  it('returns progressMs as-is when paused', () => {
    const playback = makePlayback({ isPlaying: false, progressMs: 42_000, fetchedAt: 0 });
    expect(extrapolatePositionMs(playback, 10_000)).toBe(42_000);
  });

  it('adds elapsed local time when playing', () => {
    const playback = makePlayback({ isPlaying: true, progressMs: 10_000, fetchedAt: 1_000 });
    expect(extrapolatePositionMs(playback, 3_500)).toBe(12_500);
  });

  it('clamps to track duration', () => {
    const playback = makePlayback({
      isPlaying: true,
      progressMs: 59_000,
      fetchedAt: 0,
      track: {
        id: 't',
        uri: 'spotify:track:t',
        name: 'Song',
        durationMs: 60_000,
        artists: [],
        album: { id: 'a', name: 'Album', images: [] },
      },
    });
    expect(extrapolatePositionMs(playback, 10_000)).toBe(60_000);
  });
});

describe('findActiveLineIndex', () => {
  const lines = [
    { timeMs: 1_000, text: 'a' },
    { timeMs: 5_000, text: 'b' },
    { timeMs: 10_000, text: 'c' },
  ];

  it('returns -1 before the first line', () => {
    expect(findActiveLineIndex(lines, 500)).toBe(-1);
  });

  it('returns the last line whose time has passed', () => {
    expect(findActiveLineIndex(lines, 5_500)).toBe(1);
  });

  it('returns the final line once past the last timestamp', () => {
    expect(findActiveLineIndex(lines, 999_000)).toBe(2);
  });

  it('returns -1 for an empty lyric set', () => {
    expect(findActiveLineIndex([], 5_000)).toBe(-1);
  });
});
