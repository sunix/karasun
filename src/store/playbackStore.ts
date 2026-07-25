import { create } from 'zustand';

import { PlaybackState } from '@/types/spotify';
import { SyncedLyrics } from '@/types/lyrics';

interface PlaybackStoreState {
  playback: PlaybackState | null;
  lyrics: SyncedLyrics | null;
  currentLineIndex: number;
  setPlayback: (playback: PlaybackState) => void;
  setLyrics: (lyrics: SyncedLyrics | null) => void;
  setCurrentLineIndex: (index: number) => void;
  reset: () => void;
}

export const usePlaybackStore = create<PlaybackStoreState>((set) => ({
  playback: null,
  lyrics: null,
  currentLineIndex: -1,

  setPlayback: (playback) => set({ playback }),
  setLyrics: (lyrics) => set({ lyrics, currentLineIndex: -1 }),
  setCurrentLineIndex: (currentLineIndex) => set({ currentLineIndex }),
  reset: () => set({ playback: null, lyrics: null, currentLineIndex: -1 }),
}));
