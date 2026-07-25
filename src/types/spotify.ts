export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms when accessToken expires. */
  expiresAt: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: { url: string; width: number; height: number }[];
}

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  durationMs: number;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
}

export interface SpotifyDevice {
  id: string | null;
  name: string;
  type: string;
  isActive: boolean;
  isRestricted: boolean;
  volumePercent: number | null;
}

export interface PlaybackState {
  isPlaying: boolean;
  progressMs: number;
  track: SpotifyTrack | null;
  device: SpotifyDevice | null;
  /** Date.now() at the moment this state was fetched, used for local extrapolation. */
  fetchedAt: number;
}

export class SpotifyPremiumRequiredError extends Error {
  constructor() {
    super('Cette action nécessite un compte Spotify Premium.');
    this.name = 'SpotifyPremiumRequiredError';
  }
}

export class SpotifyNoActiveDeviceError extends Error {
  constructor() {
    super("Aucun appareil Spotify actif. Ouvre Spotify sur un appareil puis réessaie.");
    this.name = 'SpotifyNoActiveDeviceError';
  }
}
