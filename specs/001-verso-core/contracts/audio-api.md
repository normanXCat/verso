# Contrats d'API REST: Instrumentales & Audio

Base path: `/api`

---

## 1. `POST /api/songs/:id/instrumentals/upload-url`
Génération d'une URL de téléversement présignée S3 pour une instrumentale.

### Entrée
```json
{
  "filename": "instru_boombap_90bpm.wav",
  "mimeType": "audio/wav",
  "sizeBytes": 48234120
}
```
*Validation Zod & Règles Métier :*
- `mimeType`: Strictement `audio/mpeg` ou `audio/wav`.
- `sizeBytes`: Entier strictement supérieur à 0 et $\le 75 \times 1024 \times 1024$ (75 Mo).
- Vérification du quota : Le texte ne doit pas déjà posséder 3 instrumentales (`COUNT < 3`).
- Vérification d'appartenance : Le texte doit appartenir à l'utilisateur connecté.

### Sortie (200 OK)
```json
{
  "uploadUrl": "https://s3.eu-west-3.amazonaws.com/verso-audio/users/.../uuid.wav?X-Amz-Signature=...",
  "s3Key": "users/uuid-user/songs/uuid-song/uuid-file.wav",
  "expiresInSeconds": 300
}
```
- **Code 400 Bad Request** : Fichier > 75 Mo ou format non supporté.
- **Code 409 Conflict** : Quota maximum de 3 instrumentales atteint pour ce texte.

---

## 2. `POST /api/songs/:id/instrumentals/confirm`
Confirmation de la réussite du téléversement et enregistrement en base.

### Entrée
```json
{
  "s3Key": "users/uuid-user/songs/uuid-song/uuid-file.wav",
  "title": "Prod Principale (WAV)",
  "mimeType": "audio/wav",
  "sizeBytes": 48234120,
  "durationSeconds": 214.5,
  "bpm": 90,
  "musicalKey": "Dm"
}
```

### Sortie (201 Created)
Retourne l'objet `Instrumental` créé et actif.

---

## 3. `PATCH /api/instrumentals/:id`
Mise à jour des métadonnées d'une instrumentale ou bascule de la piste active.

### Entrée
```json
{
  "title": "Version avec refrain",
  "bpm": 92,
  "musicalKey": "D#m",
  "isActive": true
}
```
*Comportement pour `isActive` :* Si `true`, passe automatiquement toutes les autres instrumentales de ce texte à `isActive: false`.

---

## 4. `DELETE /api/instrumentals/:id`
Suppression d'une instrumentale.
- Supprime l'enregistrement en base PostgreSQL.
- Déclenche la suppression de l'objet binaire sur le stockage compatible S3.

---

## 5. Mémos Vocaux (Freestyle Voice Notes)

### `POST /api/songs/:id/voice-notes/upload-url`
Génération d'URL présignée pour l'enregistrement vocal issu de `MediaRecorder` (`audio/webm` ou `audio/mp4`).

### `POST /api/songs/:id/voice-notes/confirm`
Enregistre la note vocale liée au texte avec sa durée en secondes.

### `DELETE /api/voice-notes/:id`
Supprime le mémo vocal en base et sur le bucket S3.
