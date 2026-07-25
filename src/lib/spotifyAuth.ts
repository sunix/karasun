import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';

import { SpotifyTokens } from '@/types/spotify';

const TOKENS_STORAGE_KEY = 'karasun.spotify.tokens';

/**
 * Scopes needed for search + reading/driving Spotify Connect playback.
 * No 'streaming' scope: v1 never plays audio inside the app itself, it only
 * remote-controls whichever Spotify Connect device (phone, PC, speaker...) is active.
 */
export const SPOTIFY_SCOPES = [
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
];

export const spotifyDiscovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export function getSpotifyClientId(): string {
  const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "EXPO_PUBLIC_SPOTIFY_CLIENT_ID est manquant. Ajoute-le dans un fichier .env (voir .env.example)."
    );
  }
  return clientId;
}

export function getSpotifyRedirectUri(): string {
  return AuthSession.makeRedirectUri({ scheme: 'karasun', path: 'callback' });
}

export function buildAuthRequestConfig(): AuthSession.AuthRequestConfig {
  return {
    clientId: getSpotifyClientId(),
    scopes: SPOTIFY_SCOPES,
    redirectUri: getSpotifyRedirectUri(),
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  };
}

function tokensFromResponse(res: AuthSession.TokenResponse, previousRefreshToken?: string): SpotifyTokens {
  if (!res.accessToken) {
    throw new Error("Réponse Spotify invalide : accessToken manquant.");
  }
  const refreshToken = res.refreshToken ?? previousRefreshToken;
  if (!refreshToken) {
    throw new Error('Réponse Spotify invalide : refreshToken manquant.');
  }
  const expiresIn = res.expiresIn ?? 3600;
  return {
    accessToken: res.accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

export async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<SpotifyTokens> {
  const response = await AuthSession.exchangeCodeAsync(
    {
      clientId: getSpotifyClientId(),
      code,
      redirectUri: getSpotifyRedirectUri(),
      extraParams: { code_verifier: codeVerifier },
    },
    spotifyDiscovery
  );
  return tokensFromResponse(response);
}

export async function refreshSpotifyTokens(refreshToken: string): Promise<SpotifyTokens> {
  const response = await AuthSession.refreshAsync(
    {
      clientId: getSpotifyClientId(),
      refreshToken,
    },
    spotifyDiscovery
  );
  return tokensFromResponse(response, refreshToken);
}

/** True if the token is expired or about to expire within `skewMs`. */
export function isTokenExpired(tokens: SpotifyTokens, skewMs = 60_000): boolean {
  return Date.now() + skewMs >= tokens.expiresAt;
}

export async function saveTokens(tokens: SpotifyTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
}

export async function loadTokens(): Promise<SpotifyTokens | null> {
  const raw = await SecureStore.getItemAsync(TOKENS_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SpotifyTokens;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKENS_STORAGE_KEY);
}
