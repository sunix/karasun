import { useEffect, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { LyricLine } from '@/types/lyrics';

interface Props {
  lines: LyricLine[];
  currentLineIndex: number;
}

export function LyricsView({ lines, currentLineIndex }: Props) {
  const listRef = useRef<FlatList<LyricLine>>(null);

  useEffect(() => {
    if (currentLineIndex < 0 || !listRef.current) return;
    listRef.current.scrollToIndex({ index: currentLineIndex, animated: true, viewPosition: 0.4 });
  }, [currentLineIndex]);

  if (lines.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.dim}>Paroles indisponibles pour ce morceau.</Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={lines}
      keyExtractor={(_, index) => String(index)}
      contentContainerStyle={styles.content}
      onScrollToIndexFailed={(info) => {
        setTimeout(() => {
          listRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.4 });
        }, 150);
      }}
      renderItem={({ item, index }) => (
        <Text style={[styles.line, index === currentLineIndex && styles.activeLine]}>{item.text}</Text>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dim: { color: '#888', fontSize: 16, textAlign: 'center' },
  content: { paddingVertical: 200, paddingHorizontal: 24 },
  line: { color: '#666', fontSize: 24, fontWeight: '600', textAlign: 'center', marginVertical: 10 },
  activeLine: { color: '#fff', fontSize: 30 },
});
