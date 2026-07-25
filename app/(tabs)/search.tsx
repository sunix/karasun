import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import { playTrack, searchTracks } from '@/lib/spotifyApi';
import { TrackRow } from '@/components/TrackRow';
import { useQueueStore } from '@/store/queueStore';
import { SpotifyTrack } from '@/types/spotify';

export default function SearchScreen() {
  const router = useRouter();
  const addTrack = useQueueStore((s) => s.addTrack);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      searchTracks(query)
        .then(setResults)
        .catch((e) => Alert.alert('Recherche impossible', e.message))
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  const playNow = async (track: SpotifyTrack) => {
    try {
      await playTrack(track.uri);
      router.push('/player');
    } catch (e: any) {
      Alert.alert('Lecture impossible', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Rechercher un titre ou un artiste…"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />
      {loading && <ActivityIndicator style={styles.loader} />}
      <FlatList
        data={results}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <TrackRow track={item} onPlayNow={() => playNow(item)} onAdd={() => addTrack(item)} />
        )}
        ListEmptyComponent={
          !loading && query.trim() ? <Text style={styles.empty}>Aucun résultat.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: {
    margin: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
  },
  loader: { marginTop: 8 },
  empty: { textAlign: 'center', marginTop: 24, color: '#666' },
});
