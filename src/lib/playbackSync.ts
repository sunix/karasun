import { useEffect, useRef } from 'react';

import { getPlaybackState } from '@/lib/spotifyApi';
import { usePlaybackStore } from '@/store/playbackStore';
import { LyricLine } from '@/types/lyrics';
import { PlaybackState } from '@/types/spotify';

/** How often we re-fetch real playback state from Spotify to correct local drift. */
const RESYNC_INTERVAL_MS = 7_000;
/** How often we recompute the active lyric line from the local clock. */
const TICK_INTERVAL_MS = 500;

/**
 * Extrapolates the current playback position from the last known Spotify state and the
 * local clock, so the UI can update every tick without calling the (rate-limited) API.
 */
export function extrapolatePositionMs(playback: PlaybackState, now: number = Date.now()): number {
  if (!playback.isPlaying) return playback.progressMs;
  const elapsed = Math.max(0, now - playback.fetchedAt);
  const position = playback.progressMs + elapsed;
  const durationMs = playback.track?.durationMs;
  return durationMs ? Math.min(position, durationMs) : position;
}

/** Returns the index of the last lyric line whose timestamp has passed, or -1 before the first line. */
export function findActiveLineIndex(lines: LyricLine[], positionMs: number): number {
  let activeIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].timeMs <= positionMs) {
      activeIndex = i;
    } else {
      break;
    }
  }
  return activeIndex;
}

/**
 * Keeps `playbackStore`'s playback state resynced with Spotify (every RESYNC_INTERVAL_MS)
 * and derives the active lyric line locally on every tick, so the karaoke screen scrolls
 * smoothly without hammering the Spotify Web API.
 */
export function usePlaybackSync(enabled: boolean): void {
  const resyncTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const tickTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const resync = async () => {
      try {
        const state = await getPlaybackState();
        if (state) usePlaybackStore.getState().setPlayback(state);
      } catch {
        // Transient network/Spotify errors are ignored; the next resync tick will retry.
      }
    };

    const tick = () => {
      const { playback, lyrics, currentLineIndex } = usePlaybackStore.getState();
      if (!playback || !lyrics) return;
      const positionMs = extrapolatePositionMs(playback);
      const activeIndex = findActiveLineIndex(lyrics.lines, positionMs);
      if (activeIndex !== currentLineIndex) {
        usePlaybackStore.getState().setCurrentLineIndex(activeIndex);
      }
    };

    resync();
    resyncTimer.current = setInterval(resync, RESYNC_INTERVAL_MS);
    tickTimer.current = setInterval(tick, TICK_INTERVAL_MS);

    return () => {
      clearInterval(resyncTimer.current);
      clearInterval(tickTimer.current);
    };
  }, [enabled]);
}
