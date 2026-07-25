import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';

import { exchangeCodeForTokens } from '@/lib/spotifyAuth';
import { useAuthStore } from '@/store/authStore';

/**
 * Expo Router routes the OAuth redirect (karasun://callback) here as a normal
 * navigation, rather than resolving expo-auth-session's promptAsync() back in the
 * login screen. So this screen does the actual code exchange, using the PKCE
 * verifier + state stashed by the login screen in authStore.pendingAuth.
 */
export default function CallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; state?: string; error?: string }>();
  const pendingAuth = useAuthStore((s) => s.pendingAuth);
  const setTokens = useAuthStore((s) => s.setTokens);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (params.error) {
      setError(`Spotify a refusé la connexion : ${params.error}`);
      return;
    }
    if (!params.code) {
      setError('Réponse Spotify invalide (code manquant).');
      return;
    }
    if (!pendingAuth) {
      setError("Session de connexion introuvable, réessaie depuis l'écran de connexion.");
      return;
    }
    if (params.state !== pendingAuth.state) {
      setError('Réponse Spotify invalide (state incohérent), réessaie.');
      return;
    }

    exchangeCodeForTokens(params.code, pendingAuth.codeVerifier)
      .then(setTokens)
      .then(() => setDone(true))
      .catch((e) => setError(e.message ?? "Échec de l'authentification Spotify."));
    // Only run once, on the params this screen was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) {
    return <Redirect href="/(tabs)/search" />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Button title="Retour" onPress={() => router.replace('/')} />
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
      <Text style={styles.body}>Connexion à Spotify…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  body: { fontSize: 15, color: '#444' },
  error: { color: '#c0392b', textAlign: 'center' },
});
