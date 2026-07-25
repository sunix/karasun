import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { LyricsView } from '@/components/LyricsView';
import { PlayerControls } from '@/components/PlayerControls';
import { fetchSyncedLyrics } from '@/lib/lyrics';
import { usePlaybackSync } from '@/lib/playbackSync';
import { pausePlayback, resumePlayback, setVolume, skipToNext, skipToPrevious } from '@/lib/spotifyApi';
import { usePlaybackStore } from '@/store/playbackStore';

export default function PlayerScreen() {
  const router = useRouter();
  usePlaybackSync(true);

  const playback = usePlaybackStore((s) => s.playback);
  const lyrics = usePlaybackStore((s) => s.lyrics);
  const currentLineIndex = usePlaybackStore((s) => s.currentLineIndex);
  const setPlayback = usePlaybackStore((s) => s.setPlayback);
  const setLyrics = usePlaybackStore((s) => s.setLyrics);

  const lastFetchedTrackId = useRef<string | null>(null);

  useEffect(() => {
    const track = playback?.track;
    if (!track || track.id === lastFetchedTrackId.current) return;
    lastFetchedTrackId.current = track.id;
    setLyrics(null);
    fetchSyncedLyrics({
      trackName: track.name,
      artistName: track.artists[0]?.name ?? '',
      albumName: track.album.name,
      durationMs: track.durationMs,
    })
      .then((result) => setLyrics(result ?? { lines: [] }))
      .catch(() => setLyrics({ lines: [] }));
  }, [playback?.track, setLyrics]);

  const handleError = (e: any) => Alert.alert('Action Spotify impossible', e.message);

  const onPlayPause = async () => {
    if (!playback) return;
    try {
      if (playback.isPlaying) {
        await pausePlayback();
        setPlayback({ ...playback, isPlaying: false, fetchedAt: Date.now() });
      } else {
        await resumePlayback();
        setPlayback({ ...playback, isPlaying: true, fetchedAt: Date.now() });
      }
    } catch (e: any) {
      handleError(e);
    }
  };

  const onVolumeChange = async (delta: number) => {
    if (!playback?.device?.volumePercent && playback?.device?.volumePercent !== 0) return;
    const next = Math.min(100, Math.max(0, playback.device.volumePercent + delta));
    try {
      await setVolume(next);
      setPlayback({ ...playback, device: { ...playback.device, volumePercent: next } });
    } catch (e: any) {
      handleError(e);
    }
  };

  if (!playback || !playback.track) {
    return (
      <View style={styles.center}>
        <Text style={styles.dim}>
          Rien n'est en cours de lecture. Choisis un morceau depuis Recherche ou la file d'attente.
        </Text>
      </View>
    );
  }

  const { track } = playback;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {track.name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {track.artists.map((a) => a.name).join(', ')}
        </Text>
      </View>
      <LyricsView lines={lyrics?.lines ?? []} currentLineIndex={currentLineIndex} />
      <PlayerControls
        isPlaying={playback.isPlaying}
        onPlayPause={onPlayPause}
        onPrevious={() => skipToPrevious().catch(handleError)}
        onNext={() => skipToNext().catch(handleError)}
        volumePercent={playback.device?.volumePercent ?? null}
        onVolumeChange={onVolumeChange}
        deviceName={playback.device?.name}
        onOpenDevicePicker={() => router.push('/devices')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', padding: 24 },
  dim: { color: '#888', fontSize: 16, textAlign: 'center' },
  header: { paddingTop: 16, paddingHorizontal: 16, alignItems: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#aaa', fontSize: 14, marginTop: 2 },
});
