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
APK Android autonome (JS embarqué, installable directement sans Expo Go ni serveur Metro)
dans le runner GitHub — pas besoin d'un PC ou d'EAS Build. Il est signé avec la clé debug
par défaut (pas de config de signature release), donc parfait pour du sideload/test, mais
pas pour le Play Store.

1. Ouvre l'onglet **Actions** du dépôt (ou le run lié à la PR — un commentaire y renvoie
   automatiquement une fois le build terminé).
2. Télécharge l'artifact `karasun-preview-apk` (un `.zip`).
3. Dézippe-le sur ton téléphone (l'app Fichiers par défaut sait le faire) et ouvre
   `app-release.apk` pour l'installer (autorise "installer depuis une source inconnue" si
   demandé).

Optionnel : pour que cet APK de test puisse réellement se connecter à Spotify, ajoute une
variable de dépôt (Settings → Secrets and variables → Actions → Variables) nommée
`SPOTIFY_CLIENT_ID` avec ton Client ID (ce n'est pas un secret, un Client ID PKCE est
public). Sans elle, le build fonctionne quand même, l'app affiche juste l'écran
"Configuration requise". Si tu l'ajoutes, pense à enregistrer `karasun://callback` comme
URI de redirection supplémentaire sur le Spotify Developer Dashboard (différente de
celle utilisée par Expo Go en dev).

## Distribution & mises à jour (sans Google Play)

Pas de passage par le Play Store : l'app s'installe une première fois par sideload, puis
se met à jour elle-même en te redirigeant vers la dernière Release GitHub.

- **Versioning automatique** : `.github/workflows/release-please.yml` (via
  [release-please](https://github.com/googleapis/release-please)) surveille les commits
  qui arrivent sur `main`. Il maintient une "Release PR" qui accumule les changements ;
  quand tu la merges, il calcule la version (patch/minor/major), met à jour
  `CHANGELOG.md`, `package.json` et `app.json` (`expo.version`), crée le tag `vX.Y.Z` et
  publie une GitHub Release.
  - **Important : les commits sur `main` doivent suivre
    [Conventional Commits](https://www.conventionalcommits.org/)** (`fix:`, `feat:`,
    `feat!:`/pied de page `BREAKING CHANGE:` pour un major, `chore:`, `docs:`, etc.),
    sinon release-please ne peut pas déterminer le bump de version.
- **Build de la release** : dès qu'une Release est publiée, `.github/workflows/release-apk.yml`
  se déclenche, fixe `expo.version` et `expo.android.versionCode` d'après le tag
  (`scripts/set-android-version.js` — un `versionCode` strictement croissant est requis
  pour qu'Android accepte une mise à jour par-dessus l'install existante), rebuild l'APK
  et l'attache à la Release GitHub.
- **Mise à jour côté app** : `src/lib/appUpdates.ts` compare la version de l'app
  (`expo.version`, figée au build) à la dernière Release GitHub (`GET
  /repos/sunix/karasun/releases/latest`, endpoint public, pas besoin de token). Si plus
  récente, une bannière (`src/components/UpdateBanner.tsx`, affichée dans
  `app/_layout.tsx`) propose de télécharger l'APK — un tap ouvre le navigateur, qui
  télécharge le fichier ; une fois le téléchargement terminé, ouvrir la notification lance
  l'installateur standard d'Android (à confirmer manuellement, comme pour toute app hors
  Play Store — pas de mise à jour silencieuse possible sans root).

### Déclencher `release-apk.yml` après une Release (obligatoire)

Par défaut, `release-please.yml` publie la Release avec le token automatique
`GITHUB_TOKEN`. Or GitHub empêche volontairement (anti-boucle infinie) qu'un événement
créé par ce token déclenche un autre workflow — du coup `release-apk.yml` (déclenché par
`on: release: published`) ne se lance **jamais** tant que ce n'est pas corrigé, même si la
Release est bien créée.

1. Crée un **Personal Access Token** : github.com → Settings (ton compte, pas le dépôt) →
   Developer settings → Personal access tokens → Fine-grained tokens → Generate new token,
   restreint à ce dépôt, avec les permissions **Contents: Read and write** et
   **Pull requests: Read and write**.
2. Ajoute-le comme secret du dépôt (Settings → Secrets and variables → Actions →
   Secrets) sous le nom `RELEASE_PLEASE_TOKEN`.
3. Sans ce secret, `release-please.yml` continue de fonctionner (il retombe sur
   `GITHUB_TOKEN`), mais `release-apk.yml` ne se déclenchera jamais automatiquement —
   tu peux dans ce cas le lancer manuellement (onglet Actions → "Release APK" → "Run
   workflow", en indiquant le tag).

### Keystore de release (important, à faire avant de compter sur l'auto-update)

Par défaut, `release-apk.yml` signe l'APK avec la clé **debug** d'Expo — pratique, mais
son **secret est public** (le même keystore que tous les projets Expo). Ça ne pose pas de
problème pour un test manuel (`pr-preview-apk.yml`), mais ça annule la garantie de
sécurité d'un auto-updater : n'importe qui pourrait signer un faux "update" avec la même
clé et le faire passer pour légitime. Génère donc ta propre clé privée avant de compter
sur l'auto-update pour de vrais utilisateurs :

1. **Génère un keystore** (une seule fois, à faire sur ta machine, pas dans une CI) :
   ```bash
   keytool -genkeypair -v \
     -keystore karasun-release.keystore \
     -alias karasun-release \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -storepass <UN_MOT_DE_PASSE_FORT>
   ```
   Ne passe pas `-keypass` : le `keytool` moderne génère un keystore **PKCS12**, qui ne
   supporte qu'un seul mot de passe pour tout (store + clé) — il ignorerait silencieusement
   un `-keypass` différent, ce qui casserait la signature plus tard sans message clair
   avant l'échec Gradle (`Given final block not properly padded`).
2. **Sauvegarde `karasun-release.keystore` et le mot de passe dans un gestionnaire de
   mots de passe.** Si tu les perds, tu ne pourras plus jamais publier de mise à jour
   sous la même identité — tous les utilisateurs devraient désinstaller/réinstaller.
   **Ne commite jamais ce fichier.**
3. **Encode-le en base64** :
   ```bash
   base64 -w0 karasun-release.keystore > karasun-release.keystore.b64   # Linux
   base64 -i karasun-release.keystore -o karasun-release.keystore.b64  # macOS
   ```
4. Sur GitHub → Settings → **Secrets and variables → Actions → Secrets**, ajoute :
   - `ANDROID_KEYSTORE_BASE64` = contenu du fichier `.b64` (colle-le depuis un éditeur de
     texte, pas depuis un terminal, pour éviter tout caractère d'espacement parasite)
   - `ANDROID_KEYSTORE_PASSWORD` = le `storepass` choisi
   - `ANDROID_KEY_ALIAS` = `karasun-release`
5. Prochaine Release publiée : `release-apk.yml` détecte ces secrets et signe avec cette
   clé au lieu du debug (voir `plugins/withAndroidReleaseSigning.js`). Sans eux, le build
   continue de fonctionner avec la clé debug, avec un avertissement visible dans les logs
   du run.

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
- **Mises à jour** (`src/lib/appUpdates.ts`) : vérifie la dernière Release GitHub au
  démarrage et propose de télécharger l'APK si elle est plus récente (voir section
  Distribution ci-dessus).

## Portée de cette v1 / limites connues

- Pas de suppression de voix / traitement audio.
- Nécessite Spotify Premium pour contrôler la lecture.
- Un seul appareil "contrôleur" (le téléphone) gère la recherche et la file d'attente ;
  pas de salle multi-téléphones type "mode fête".
- Les paroles dépendent de la disponibilité sur lrclib.net ; certains morceaux peuvent
  ne pas avoir de paroles synchronisées.
