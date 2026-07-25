import { useAuthStore } from '@/store/authStore';
import {
  PlaybackState,
  SpotifyDevice,
  SpotifyNoActiveDeviceError,
  SpotifyPremiumRequiredError,
  SpotifyTrack,
} from '@/types/spotify';

const API_BASE = 'https://api.spotify.com/v1';

async function spotifyFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const accessToken = await useAuthStore.getState().getValidAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (response.status === 401) {
    await useAuthStore.getState().logout();
    throw new Error('Session Spotify expirée, reconnecte-toi.');
  }

  if (response.status === 404) {
    // Spotify returns 404 NO_ACTIVE_DEVICE for most /me/player/* actions when nothing is playing anywhere.
    throw new SpotifyNoActiveDeviceError();
  }

  if (response.status === 403) {
    const body = await response.json().catch(() => null);
    if (body?.error?.reason === 'PREMIUM_REQUIRED') {
      throw new SpotifyPremiumRequiredError();
    }
    throw new Error(body?.error?.message ?? 'Action Spotify refusée (403).');
  }

  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Erreur Spotify (${response.status}).`);
  }

  return response;
}

function mapTrack(raw: any): SpotifyTrack {
  return {
    id: raw.id,
    uri: raw.uri,
    name: raw.name,
    durationMs: raw.duration_ms,
    artists: (raw.artists ?? []).map((a: any) => ({ id: a.id, name: a.name })),
    album: {
      id: raw.album?.id,
      name: raw.album?.name,
      images: raw.album?.images ?? [],
    },
  };
}

function mapDevice(raw: any): SpotifyDevice {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    isActive: raw.is_active,
    isRestricted: raw.is_restricted,
    volumePercent: raw.volume_percent ?? null,
  };
}

export async function searchTracks(query: string, limit = 20): Promise<SpotifyTrack[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({ q: query, type: 'track', limit: String(limit) });
  const response = await spotifyFetch(`/search?${params.toString()}`);
  const body = await response.json();
  return (body.tracks?.items ?? []).map(mapTrack);
}

export async function getPlaybackState(): Promise<PlaybackState | null> {
  const response = await spotifyFetch('/me/player');
  if (response.status === 204) return null;
  const body = await response.json();
  if (!body) return null;
  return {
    isPlaying: body.is_playing,
    progressMs: body.progress_ms ?? 0,
    track: body.item ? mapTrack(body.item) : null,
    device: body.device ? mapDevice(body.device) : null,
    fetchedAt: Date.now(),
  };
}

export async function getDevices(): Promise<SpotifyDevice[]> {
  const response = await spotifyFetch('/me/player/devices');
  const body = await response.json();
  return (body.devices ?? []).map(mapDevice);
}

export async function transferPlayback(deviceId: string, play = true): Promise<void> {
  await spotifyFetch('/me/player', {
    method: 'PUT',
    body: JSON.stringify({ device_ids: [deviceId], play }),
  });
}

function deviceQuery(deviceId?: string): string {
  return deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
}

export async function playTrack(trackUri: string, deviceId?: string): Promise<void> {
  await spotifyFetch(`/me/player/play${deviceQuery(deviceId)}`, {
    method: 'PUT',
    body: JSON.stringify({ uris: [trackUri] }),
  });
}

export async function resumePlayback(deviceId?: string): Promise<void> {
  await spotifyFetch(`/me/player/play${deviceQuery(deviceId)}`, { method: 'PUT' });
}

export async function pausePlayback(deviceId?: string): Promise<void> {
  await spotifyFetch(`/me/player/pause${deviceQuery(deviceId)}`, { method: 'PUT' });
}

export async function seekToPosition(positionMs: number, deviceId?: string): Promise<void> {
  const params = new URLSearchParams({ position_ms: String(Math.max(0, Math.round(positionMs))) });
  if (deviceId) params.set('device_id', deviceId);
  await spotifyFetch(`/me/player/seek?${params.toString()}`, { method: 'PUT' });
}

export async function setVolume(volumePercent: number, deviceId?: string): Promise<void> {
  const params = new URLSearchParams({
    volume_percent: String(Math.min(100, Math.max(0, Math.round(volumePercent)))),
  });
  if (deviceId) params.set('device_id', deviceId);
  await spotifyFetch(`/me/player/volume?${params.toString()}`, { method: 'PUT' });
}

export async function skipToNext(deviceId?: string): Promise<void> {
  await spotifyFetch(`/me/player/next${deviceQuery(deviceId)}`, { method: 'POST' });
}

export async function skipToPrevious(deviceId?: string): Promise<void> {
  await spotifyFetch(`/me/player/previous${deviceQuery(deviceId)}`, { method: 'POST' });
}
