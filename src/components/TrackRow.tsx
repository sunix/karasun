import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SpotifyTrack } from '@/types/spotify';

interface Props {
  track: SpotifyTrack;
  onPlayNow?: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

export function TrackRow({ track, onPlayNow, onAdd, onRemove }: Props) {
  const artistNames = track.artists.map((a) => a.name).join(', ');
  const artwork = track.album.images[track.album.images.length - 1]?.url;

  return (
    <View style={styles.row}>
      {artwork ? (
        <Image source={{ uri: artwork }} style={styles.artwork} />
      ) : (
        <View style={[styles.artwork, styles.artworkPlaceholder]} />
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {track.name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {artistNames}
        </Text>
      </View>
      <View style={styles.actions}>
        {onPlayNow && (
          <TouchableOpacity onPress={onPlayNow} style={styles.actionButton}>
            <Text style={styles.actionText}>▶ Lire</Text>
          </TouchableOpacity>
        )}
        {onAdd && (
          <TouchableOpacity onPress={onAdd} style={styles.actionButton}>
            <Text style={styles.actionText}>+ File</Text>
          </TouchableOpacity>
        )}
        {onRemove && (
          <TouchableOpacity onPress={onRemove} style={styles.actionButton}>
            <Text style={styles.actionText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, gap: 10 },
  artwork: { width: 48, height: 48, borderRadius: 4 },
  artworkPlaceholder: { backgroundColor: '#ddd' },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 13, color: '#666' },
  actions: { flexDirection: 'row', gap: 6 },
  actionButton: { paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#1DB954', borderRadius: 6 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
