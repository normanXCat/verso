# Contrats d'API REST: Albums & Tracklists

Base path: `/api/albums`

---

## 1. `GET /api/albums`
Liste des albums de l'utilisateur connecté avec nombre de morceaux associés.

### Sortie (200 OK)
```json
[
  {
    "id": "uuid-album-1",
    "title": "Première Ligne",
    "description": "Projet 8 titres enregistré entre Paris et Bruxelles.",
    "coverImageUrl": "https://s3.../signed-cover.jpg",
    "tracksCount": 8,
    "createdAt": "2026-10-01T10:00:00Z",
    "updatedAt": "2026-10-03T14:00:00Z"
  }
]
```

---

## 2. `POST /api/albums`
Création d'un nouvel album.

### Entrée
```json
{
  "title": "Première Ligne",
  "description": "Projet 8 titres...",
  "coverImageKey": "users/.../cover.jpg"
}
```
*Validation Zod :*
- `title`: chaîne 1 à 200 caractères, non vide.
- `description`: optionnelle, max 2000 caractères.
- `coverImageKey`: optionnelle, clé S3 valide.

### Sortie (201 Created)
Retourne l'objet `Album` créé.

---

## 3. `GET /api/albums/:id`
Détail d'un album avec sa tracklist ordonnée.

### Sortie (200 OK)
```json
{
  "id": "uuid-album-1",
  "title": "Première Ligne",
  "description": "Projet 8 titres...",
  "coverImageUrl": "https://s3.../signed-cover.jpg",
  "tracks": [
    {
      "id": "uuid-song-1",
      "title": "Nuit blanche",
      "position": 1,
      "status": "COMPLETED",
      "durationSeconds": 185,
      "bpm": 90,
      "wordCount": 342,
      "lineCount": 48
    },
    {
      "id": "uuid-song-2",
      "title": "Asphalte",
      "position": 2,
      "status": "DRAFT",
      "durationSeconds": 210,
      "bpm": 94,
      "wordCount": 410,
      "lineCount": 56
    }
  ]
}
```

---

## 4. `PUT /api/albums/:id`
Mise à jour des métadonnées d'un album (titre, description, pochette).

---

## 5. `PUT /api/albums/:id/tracks/reorder`
Réordonnancement par glisser-déposer de la tracklist de l'album.

### Entrée
```json
{
  "songIds": [
    "uuid-song-2",
    "uuid-song-1"
  ]
}
```
*Validation Zod :* Tableau d'UUIDs valides appartenant tous à l'utilisateur et actuellement rattachés à cet album.

### Sortie (200 OK)
```json
{
  "message": "Ordre des pistes mis à jour avec succès.",
  "tracks": [
    { "id": "uuid-song-2", "position": 1 },
    { "id": "uuid-song-1", "position": 2 }
  ]
}
```

---

## 6. `POST /api/albums/:id/tracks`
Ajout d'un texte existant à l'album.

### Entrée
```json
{
  "songId": "uuid-song-3"
}
```
*Comportement :* Assigne `song.albumId = album.id` et attribue la dernière position dans la tracklist (`MAX(position) + 1`).

---

## 7. `DELETE /api/albums/:id/tracks/:songId`
Retrait d'un texte de l'album sans supprimer le texte.
- Assigne `song.albumId = null` et `song.position = null`.
- Réajuste les positions des pistes restantes de l'album.

---

## 8. `DELETE /api/albums/:id`
Suppression de l'album.
- **Règle constitutionnelle & fonctionnelle stricte :** La suppression de l'album détache tous les textes associés (`albumId = null`) sans en supprimer aucun de la base.
- L'image de pochette associée sur S3 est nettoyée.
