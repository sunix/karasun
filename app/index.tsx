import * as AuthSession from 'expo-auth-session';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';

import { exchangeCodeForTokens, getSpotifyRedirectUri, spotifyDiscovery, SPOTIFY_SCOPES } from '@/lib/spotifyAuth';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const status = useAuthStore((s) => s.status);
  const setTokens = useAuthStore((s) => s.setTokens);
  const [authError, setAuthError] = useState<string | null>(null);

  const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
  const redirectUri = getSpotifyRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId ?? '',
      scopes: SPOTIFY_SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    spotifyDiscovery
  );

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success' && request?.codeVerifier) {
      exchangeCodeForTokens(response.params.code, request.codeVerifier)
        .then(setTokens)
        .catch((e) => setAuthError(e.message ?? "Échec de l'authentification Spotify."));
    } else if (response.type === 'error') {
      setAuthError(response.error?.message ?? "Échec de l'authentification Spotify.");
    }
  }, [response, request, setTokens]);

  if (status === 'loading' || status === 'idle') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (status === 'authenticated') {
    return <Redirect href="/(tabs)/search" />;
  }

  if (!clientId) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Configuration requise</Text>
        <Text style={styles.body}>
          Ajoute EXPO_PUBLIC_SPOTIFY_CLIENT_ID dans un fichier .env à la racine du projet
          (voir .env.example), puis enregistre cette URI de redirection dans ton app sur le
          Spotify Developer Dashboard :
        </Text>
        <Text style={styles.code}>{redirectUri}</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Karasun</Text>
      <Text style={styles.body}>Karaoké piloté par ton compte Spotify Premium.</Text>
      <Button title="Se connecter avec Spotify" disabled={!request} onPress={() => promptAsync()} />
      {authError && <Text style={styles.error}>{authError}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700' },
  body: { fontSize: 15, textAlign: 'center', color: '#444' },
  code: { fontSize: 13, fontFamily: 'monospace', backgroundColor: '#eee', padding: 8, borderRadius: 6 },
  error: { color: '#c0392b', textAlign: 'center' },
});
