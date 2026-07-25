import { create } from 'zustand';

import {
  clearTokens,
  isTokenExpired,
  loadTokens,
  refreshSpotifyTokens,
  saveTokens,
} from '@/lib/spotifyAuth';
import { SpotifyTokens } from '@/types/spotify';

interface PendingAuth {
  codeVerifier: string;
  state: string;
}

interface AuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  tokens: SpotifyTokens | null;
  /**
   * PKCE verifier + state for the in-flight login attempt. Expo Router routes the OAuth
   * redirect to app/callback.tsx as a normal navigation (not back into the screen that
   * started the flow), so the code exchange there needs this stashed separately instead
   * of reading it off the original AuthRequest instance.
   */
  pendingAuth: PendingAuth | null;
  setPendingAuth: (pendingAuth: PendingAuth) => void;
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
  pendingAuth: null,

  setPendingAuth: (pendingAuth) => set({ pendingAuth }),

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
