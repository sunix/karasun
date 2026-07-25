import { create } from 'zustand';

import {
  clearTokens,
  isTokenExpired,
  loadTokens,
  refreshSpotifyTokens,
  saveTokens,
} from '@/lib/spotifyAuth';
import { SpotifyTokens } from '@/types/spotify';

interface AuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  tokens: SpotifyTokens | null;
  /** Loads persisted tokens on app start. */
  hydrate: () => Promise<void>;
  /** Persists freshly-obtained tokens (e.g. right after the OAuth code exchange). */
  setTokens: (tokens: SpotifyTokens) => Promise<void>;
  logout: () => Promise<void>;
  /** Returns a non-expired access token, refreshing it first if needed. */
  getValidAccessToken: () => Promise<string>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  tokens: null,

  hydrate: async () => {
    set({ status: 'loading' });
    const tokens = await loadTokens();
    set({ tokens, status: tokens ? 'authenticated' : 'unauthenticated' });
  },

  setTokens: async (tokens) => {
    await saveTokens(tokens);
    set({ tokens, status: 'authenticated' });
  },

  logout: async () => {
    await clearTokens();
    set({ tokens: null, status: 'unauthenticated' });
  },

  getValidAccessToken: async () => {
    const current = get().tokens;
    if (!current) {
      throw new Error('Non authentifié.');
    }
    if (!isTokenExpired(current)) {
      return current.accessToken;
    }
    const refreshed = await refreshSpotifyTokens(current.refreshToken);
    await get().setTokens(refreshed);
    return refreshed.accessToken;
  },
}));
