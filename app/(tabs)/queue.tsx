import { useRouter } from 'expo-router';
import { Alert, Button, FlatList, StyleSheet, Text, View } from 'react-native';

import { playTrack } from '@/lib/spotifyApi';
import { TrackRow } from '@/components/TrackRow';
import { useQueueStore } from '@/store/queueStore';
import { SpotifyTrack } from '@/types/spotify';

export default function QueueScreen() {
  const router = useRouter();
  const tracks = useQueueStore((s) => s.tracks);
  const removeTrack = useQueueStore((s) => s.removeTrack);
  const popNext = useQueueStore((s) => s.popNext);

  const play = async (track: SpotifyTrack) => {
    try {
      await playTrack(track.uri);
      router.push('/player');
    } catch (e: any) {
      Alert.alert('Lecture impossible', e.message);
    }
  };

  const playNextInQueue = async () => {
    const next = popNext();
    if (!next) return;
    await play(next);
  };

  return (
    <View style={styles.container}>
      {tracks.length > 0 && (
        <View style={styles.header}>
          <Button title="▶ Lire le morceau suivant de la file" onPress={playNextInQueue} />
        </View>
      )}
      <FlatList
        data={tracks}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <TrackRow track={item} onPlayNow={() => play(item)} onRemove={() => removeTrack(item.id)} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            File d'attente vide. Ajoute des morceaux depuis l'onglet Recherche.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 12 },
  empty: { textAlign: 'center', marginTop: 24, color: '#666', paddingHorizontal: 24 },
});
