# Contrats d'API REST: Textes, Versions & Partages

Base path: `/api/songs`

---

## 1. `GET /api/songs`
Recherche et liste des textes de l'utilisateur connecté.

### Paramètres Query (Optionnels)
- `q`: Recherche textuelle (titre ou paroles)
- `status`: `DRAFT` ou `COMPLETED`
- `albumId`: Filtrer par album
- `isFavorite`: `true` ou `false`
- `tag`: Nom ou ID de tag
- `page`: Défaut 1
- `limit`: Défaut 20 (max 100)

### Sortie (200 OK)
```json
{
  "items": [
    {
      "id": "uuid-song-1",
      "title": "Nuit blanche",
      "status": "DRAFT",
      "isFavorite": true,
      "album": {
        "id": "uuid-album-1",
        "title": "Première Ligne"
      },
      "wordCount": 342,
      "lineCount": 48,
      "tags": [
        { "id": "uuid-tag-1", "name": "Mélancolie", "color": "#6366f1" }
      ],
      "hasAudio": true,
      "updatedAt": "2026-10-03T14:22:00Z"
    }
  ],
  "total": 1
}
```

---

## 2. `POST /api/songs`
Création d'un nouveau texte.

### Entrée
```json
{
  "title": "Nouveau texte",
  "content": "",
  "albumId": null,
  "status": "DRAFT"
}
```

### Sortie (201 Created)
Retourne l'objet `Song` complet initialisé.

---

## 3. `GET /api/songs/:id`
Récupération détaillée d'un texte pour l'éditeur.

### Sortie (200 OK)
```json
{
  "id": "uuid-song-1",
  "title": "Nuit blanche",
  "content": "J'écris sous la lune quand la ville s'endort...\nChaque rime est une balise sur le port.",
  "status": "DRAFT",
  "isFavorite": true,
  "albumId": "uuid-album-1",
  "instrumentals": [
    {
      "id": "uuid-instru-1",
      "title": "Prod Principale (90 BPM)",
      "s3Key": "users/.../beat.mp3",
      "downloadUrl": "https://s3.../signed-get-url",
      "bpm": 90,
      "musicalKey": "Dm",
      "isActive": true
    }
  ],
  "tags": [
    { "id": "uuid-tag-1", "name": "Mélancolie", "color": "#6366f1" }
  ],
  "versionsCount": 12,
  "updatedAt": "2026-10-03T14:22:00Z"
}
```

---

## 4. `PATCH /api/songs/:id`
Sauvegarde automatique et mise à jour d'un texte.

### Entrée
```json
{
  "title": "Nuit blanche (Version finale)",
  "content": "Contenu complet mis à jour...",
  "status": "COMPLETED",
  "isFavorite": true,
  "albumId": "uuid-album-1",
  "tagIds": ["uuid-tag-1", "uuid-tag-2"],
  "createVersion": false
}
```
*Note sur `createVersion` :* Si `true` (ou après un intervalle d'inactivité de 5 minutes consécutives), un instantané est automatiquement archivé dans la table `SongVersion`.

### Sortie (200 OK)
Objet `Song` mis à jour avec son nouveau timestamp `updatedAt`.
En cas de conflit de version réseau : `409 Conflict`.

---

## 5. `DELETE /api/songs/:id`
Suppression d'un texte.
- **Sortie (200 OK)** : Suppression du texte, de ses versions, et détachement/nettoyage des pistes audio S3 associées.

---

## 6. `GET /api/songs/:id/versions` & `POST /api/songs/:id/versions/:versionId/restore`
Gestion de l'historique permanent.

### `GET /api/songs/:id/versions`
- **Sortie (200 OK)** :
```json
[
  {
    "id": "uuid-version-1",
    "title": "Nuit blanche - Brouillon 1",
    "content": "Contenu de la version d'il y a 2 heures...",
    "createdAt": "2026-10-03T12:00:00Z"
  }
]
```

### `POST /api/songs/:id/versions/:versionId/restore`
Restaure le contenu de cette version comme contenu courant du texte, tout en archivant l'état précédent dans l'historique (zéro perte).

---

## 7. `GET /api/songs/:id/export/pdf`
Génération et téléchargement du certificat PDF d'antériorité.
- **Réponse (200 OK)** : Flux binaire `application/pdf` avec en-tête `Content-Disposition: attachment; filename="nuit-blanche-verso-2026-10-03.pdf"`.

---

## 8. Liens de Partage Privés

### `POST /api/songs/:id/share-links`
Création d'un lien de partage en lecture seule.
```json
{
  "expiresInDays": 7
}
```
Sortie (201 Created) :
```json
{
  "id": "uuid-link-1",
  "shareUrl": "https://verso.app/share/sec_k98df23jklm08sd...",
  "expiresAt": "2026-10-10T12:00:00Z",
  "isRevoked": false
}
```

### `DELETE /api/songs/:id/share-links/:linkId`
Révocation immédiate d'un lien de partage.

### `GET /api/public/shares/:token` (Route publique sous Rate Limit)
Consultation anonyme et sécurisée en lecture seule du texte partagé.
```json
{
  "title": "Nuit blanche",
  "authorDisplayName": "MC Plume",
  "content": "J'écris sous la lune quand la ville s'endort...",
  "status": "COMPLETED",
  "updatedAt": "2026-10-03T14:22:00Z"
}
```
*Sécurité :* Zéro métadonnée personnelle (ni email, ni ID de compte), accès strictement en lecture seule, rate limit strict de 30 requêtes par minute par IP.
