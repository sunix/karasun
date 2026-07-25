import { create } from 'zustand';

import { SpotifyTrack } from '@/types/spotify';

interface QueueState {
  tracks: SpotifyTrack[];
  addTrack: (track: SpotifyTrack) => void;
  removeTrack: (trackId: string) => void;
  reorder: (fromIndex: number, toIndex: number) => void;
  /** Removes and returns the first track in the queue, or null if empty. */
  popNext: () => SpotifyTrack | null;
  clear: () => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  tracks: [],

  addTrack: (track) => {
    if (get().tracks.some((t) => t.id === track.id)) return;
    set((state) => ({ tracks: [...state.tracks, track] }));
  },

  removeTrack: (trackId) => {
    set((state) => ({ tracks: state.tracks.filter((t) => t.id !== trackId) }));
  },

  reorder: (fromIndex, toIndex) => {
    set((state) => {
      const tracks = [...state.tracks];
      const [moved] = tracks.splice(fromIndex, 1);
      if (!moved) return state;
      tracks.splice(toIndex, 0, moved);
      return { tracks };
    });
  },

  popNext: () => {
    const [first, ...rest] = get().tracks;
    if (!first) return null;
    set({ tracks: rest });
    return first;
  },

  clear: () => set({ tracks: [] }),
}));
