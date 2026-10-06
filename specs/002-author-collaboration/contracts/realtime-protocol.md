# Protocol Specification: Collaboration Temps Réel (Phase P3)

Définit le protocole WebSocket et l'intégration Yjs pour l'écriture collaborative simultanée avec curseurs partagés et la synchronisation du mode « session studio » audio.

---

## 1. Connexion & Handshake WebSocket

### Endpoint : `GET /ws/songs/:id/collaboration` (Bascule WebSocket `101 Switching Protocols`)

- **Authentification** : Cookie de session HTTP (`SameSite=Lax`, `Secure`, `HttpOnly`) validé lors de l'établissement du handshake HTTP.
- **Autorisation** : Appel systématique à la fonction centrale `can(user, song, 'read')`.
  - Si `can()` retourne `false` : fermeture immédiate de la connexion socket avec le code `4404` (équivalent introuvable / non autorisé).
  - Si l'utilisateur possède le rôle `CO_AUTHOR` ou est propriétaire : droit d'émission des deltas d'écriture.
  - Si l'utilisateur possède le rôle `COMMENTER` ou `READER` : droit d'écoute et d'awareness en lecture seule uniquement.

---

## 2. Protocole Yjs & Awareness (Éditeur de Paroles)

### Canaux de Messages Binaires (Sous-protocole Yjs)

Le canal utilise l'encodage standard `y-protocols` :
1. **Sync Protocol (`y-protocols/sync`)** :
   - `MessageSyncStep1` : Le client envoie son vecteur d'état local à la connexion.
   - `MessageSyncStep2` : Le serveur répond avec les deltas manquants.
   - `MessageSyncUpdate` : Diffusion en temps réel des deltas de frappe aux autres collaborateurs connectés.
2. **Awareness Protocol (`y-protocols/awareness`)** :
   - Diffuse la présence active, la position du curseur, la sélection textuelle et le profil visuel de l'artiste :
   ```json
   {
     "user": {
       "id": "usr_collab_2",
       "displayName": "Booba",
       "color": "#D9421C" // Couleur de curseur assignée dynamiquement
     },
     "cursor": {
       "anchor": 142,
       "head": 160
     }
   }
   ```

### Binding CodeMirror 6
- Le composant frontend `LyricEditor.tsx` intègre `y-codemirror` pour synchroniser le `Text` du CRDT avec le state CodeMirror sans bloquer la frappe locale.
- Les extensions de versification (gouttière de syllabes et coloration des rimes) se recalculent localement au fil des deltas reçus.

---

## 3. Protocole « Mode Session Studio » (Audio Synchronisé)

Permet aux co-auteurs de caler leurs rimes au millième de seconde sur la même instrumentale et le même métronome.

### Format des Messages de Contrôle Audio (JSON UTF-8)

Les messages audio transitent sur un canal dédié encapsulé dans le WebSocket :

#### `studio:play` (Déclenchement de lecture partagée)
```json
{
  "type": "studio:play",
  "positionMs": 42500,
  "serverTimeMs": 1791280800000,
  "bpm": 92
}
```

#### `studio:pause` (Mise en pause)
```json
{
  "type": "studio:pause",
  "positionMs": 48200
}
```

#### `studio:seek` (Déplacement dans la timeline)
```json
{
  "type": "studio:seek",
  "positionMs": 16000
}
```

#### `studio:bpm_change` (Modification du tempo)
```json
{
  "type": "studio:bpm_change",
  "bpm": 96
}
```

### Mécanisme de Compensation de Latence
Le client calcule le décalage réseau via un ping/pong périodique de synchronisation d'horloge (algorithme de type NTP) :
$$\text{positionLocale} = \text{positionMs} + (\text{horlogeLocale} - \text{serverTimeMs})$$
Le lecteur Web Audio (`useAudioPlayer`) planifie le démarrage du buffer sonore et du clic du métronome à l'instant compensé exact.

---

## 4. Persistance en Base & Résilience Hors Ligne

1. **Persistance des deltas** :
   - Le serveur Fastify maintient le document `Y.Doc` en mémoire vive.
   - Toutes les 2 secondes d'inactivité de frappe (debounce), le document est sérialisé sous forme de blob binaire compressé et persisté en PostgreSQL, avec projection du texte brut dans `Song.lyrics`.
2. **Tolérance aux coupures réseau** :
   - En cas de perte de connexion WebSocket, l'éditeur bascule immédiatement en mode asynchrone local (persistance IndexedDB via `useOfflineSync`).
   - Au retour de la connexion, le socket se reconnecte automatiquement, exécute le handshake `SyncStep1/Step2`, et fusionne les modifications hors ligne de manière mathématiquement déterministe grâce au modèle CRDT de Yjs.
