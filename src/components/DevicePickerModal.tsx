import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getDevices, transferPlayback } from '@/lib/spotifyApi';
import { SpotifyDevice } from '@/types/spotify';

interface Props {
  onSelected: () => void;
}

export function DevicePickerModal({ onSelected }: Props) {
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDevices()
      .then(setDevices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const select = async (device: SpotifyDevice) => {
    if (!device.id) return;
    try {
      await transferPlayback(device.id, true);
      onSelected();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={devices}
        keyExtractor={(d, i) => d.id ?? String(i)}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => select(item)}>
            <View>
              <Text style={styles.name}>
                {item.name} {item.isActive ? '• actif' : ''}
              </Text>
              <Text style={styles.type}>{item.type}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Aucun appareil trouvé. Ouvre Spotify sur ton téléphone, ton PC ou une enceinte connectée,
            puis réessaie.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ccc' },
  name: { fontSize: 16, fontWeight: '600' },
  type: { fontSize: 13, color: '#666', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 24, padding: 24, color: '#666' },
  error: { color: '#c0392b', textAlign: 'center', padding: 12 },
});
