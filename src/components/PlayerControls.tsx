import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  volumePercent: number | null;
  onVolumeChange: (delta: number) => void;
  deviceName?: string;
  onOpenDevicePicker: () => void;
}

export function PlayerControls({
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  volumePercent,
  onVolumeChange,
  deviceName,
  onOpenDevicePicker,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.transport}>
        <TouchableOpacity onPress={onPrevious} style={styles.button}>
          <Text style={styles.buttonText}>⏮</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPlayPause} style={[styles.button, styles.playButton]}>
          <Text style={styles.buttonText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} style={styles.button}>
          <Text style={styles.buttonText}>⏭</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.secondaryRow}>
        {volumePercent !== null && (
          <View style={styles.volume}>
            <TouchableOpacity onPress={() => onVolumeChange(-10)} style={styles.smallButton}>
              <Text style={styles.smallButtonText}>🔉</Text>
            </TouchableOpacity>
            <Text style={styles.volumeText}>{volumePercent}%</Text>
            <TouchableOpacity onPress={() => onVolumeChange(10)} style={styles.smallButton}>
              <Text style={styles.smallButtonText}>🔊</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity onPress={onOpenDevicePicker} style={styles.deviceButton}>
          <Text style={styles.deviceButtonText}>📱 {deviceName ?? 'Choisir un appareil'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, paddingHorizontal: 16, paddingBottom: 24 },
  transport: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24 },
  button: { padding: 12 },
  playButton: { backgroundColor: '#1DB954', borderRadius: 32, paddingHorizontal: 20 },
  buttonText: { fontSize: 28, color: '#fff' },
  secondaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  volume: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallButton: { padding: 6 },
  smallButtonText: { fontSize: 18 },
  volumeText: { color: '#fff', fontSize: 14, minWidth: 36, textAlign: 'center' },
  deviceButton: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#333', borderRadius: 8 },
  deviceButtonText: { color: '#fff', fontSize: 13 },
});
