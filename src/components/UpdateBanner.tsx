import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { AvailableUpdate, checkForUpdate } from '@/lib/appUpdates';

/** Small tap-to-download banner shown when a newer GitHub Release is available. */
export function UpdateBanner() {
  const [update, setUpdate] = useState<AvailableUpdate | null>(null);

  useEffect(() => {
    checkForUpdate()
      .then(setUpdate)
      .catch(() => {});
  }, []);

  if (!update) return null;

  return (
    <TouchableOpacity style={styles.banner} onPress={() => Linking.openURL(update.apkUrl)}>
      <Text style={styles.text}>Mise à jour {update.version} disponible — toucher pour télécharger</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: '#1DB954', paddingVertical: 10, paddingHorizontal: 12 },
  text: { color: '#fff', textAlign: 'center', fontSize: 13, fontWeight: '600' },
});
