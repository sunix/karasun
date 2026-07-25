# Karasun

Application mobile de karaoké (style KaraFun) qui pilote la lecture de ton compte
Spotify et affiche des paroles synchronisées. **Aucune manipulation audio** (pas de
suppression de voix) dans cette v1 : l'app contrôle uniquement play/pause/seek/volume/
changement de piste via l'API Spotify.

Comme le contrôle passe par l'API Web Spotify (Spotify Connect), tu peux déjà envoyer la
lecture vers **n'importe quel appareil Spotify actif** — ton téléphone, un PC qui a
l'app Spotify ouverte, une enceinte connectée, etc. — via l'écran "Choisir un appareil".
Il n'y a pas encore d'écran de paroles dédié affiché directement sur PC (prévu pour plus
tard si besoin).

## Prérequis

- Un compte **Spotify Premium** (obligatoire : l'API Spotify refuse les commandes de
  lecture — play/pause/seek/volume — pour les comptes gratuits).
- [Node.js](https://nodejs.org/) et l'app **Expo Go** installée sur ton téléphone Android
  (disponible sur le Play Store).
- Un compte sur le [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).

## Configuration (une seule fois)

1. Installe les dépendances : `npm install`.
2. Lance l'app une première fois **sans** fichier `.env` : `npx expo start`, puis scanne
   le QR code avec Expo Go. L'écran affichera "Configuration requise" avec une **URI de
   redirection** à copier (elle dépend de ton réseau local en dev, donc ne la fige pas
   ailleurs que dans le dashboard Spotify).
3. Sur le [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), crée
   une app, puis dans ses paramètres ajoute cette URI de redirection exactement telle
   qu'affichée.
4. Copie `.env.example` vers `.env` et renseigne `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` avec le
   Client ID de ton app Spotify (pas besoin de client secret, le flux OAuth utilisé est
   PKCE).
5. Relance `npx expo start` et reconnecte-toi.

Si tu passes plus tard à un build natif (dev client / build de prod) plutôt qu'Expo Go,
l'URI de redirection changera pour `karasun://callback` — il faudra l'ajouter en plus
dans le dashboard Spotify à ce moment-là.

## Lancer l'app

```bash
npx expo start
```

Scanne le QR code avec Expo Go sur ton téléphone Android.

## Tester une PR sans PC (APK via GitHub Actions)

Chaque pull request déclenche `.github/workflows/pr-preview-apk.yml`, qui compile un
APK Android **debug** (installable directement, sans passer par Expo Go) dans le runner
GitHub — pas besoin d'un PC ou d'EAS Build.

1. Ouvre l'onglet **Actions** du dépôt (ou le run lié à la PR — un commentaire y renvoie
   automatiquement une fois le build terminé).
2. Télécharge l'artifact `karasun-preview-apk` (un `.zip`).
3. Dézippe-le sur ton téléphone (l'app Fichiers par défaut sait le faire) et ouvre
   `app-debug.apk` pour l'installer (autorise "installer depuis une source inconnue" si
   demandé).

Optionnel : pour que cet APK de test puisse réellement se connecter à Spotify, ajoute une
variable de dépôt (Settings → Secrets and variables → Actions → Variables) nommée
`SPOTIFY_CLIENT_ID` avec ton Client ID (ce n'est pas un secret, un Client ID PKCE est
public). Sans elle, le build fonctionne quand même, l'app affiche juste l'écran
"Configuration requise". Si tu l'ajoutes, pense à enregistrer `karasun://callback` comme
URI de redirection supplémentaire sur le Spotify Developer Dashboard (différente de
celle utilisée par Expo Go en dev).

## Vérifications

```bash
npm run typecheck   # tsc --noEmit
npm test            # Jest — logique pure (parseur LRC, extrapolation de position)
```

## Architecture

- **Auth** (`src/lib/spotifyAuth.ts`, `src/store/authStore.ts`) : OAuth PKCE via
  `expo-auth-session`, jetons stockés avec `expo-secure-store`, rafraîchissement
  automatique.
- **API Spotify** (`src/lib/spotifyApi.ts`) : recherche, état de lecture, play/pause/seek/
  volume, liste et transfert des appareils Spotify Connect.
- **Paroles** (`src/lib/lyrics.ts`) : récupération de paroles synchronisées via
  [lrclib.net](https://lrclib.net) (base ouverte et gratuite) + parseur de format `.lrc`.
- **Synchro lecture/paroles** (`src/lib/playbackSync.ts`) : extrapolation locale de la
  position de lecture (pour éviter de saturer l'API Spotify) avec resynchronisation
  périodique.
- **Écrans** (`app/`) : connexion, recherche, file d'attente, lecteur karaoké, sélecteur
  d'appareil — via Expo Router.

## Portée de cette v1 / limites connues

- Pas de suppression de voix / traitement audio.
- Nécessite Spotify Premium pour contrôler la lecture.
- Un seul appareil "contrôleur" (le téléphone) gère la recherche et la file d'attente ;
  pas de salle multi-téléphones type "mode fête".
- Les paroles dépendent de la disponibilité sur lrclib.net ; certains morceaux peuvent
  ne pas avoir de paroles synchronisées.
