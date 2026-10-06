# API Contract: Commentaires & Discussions

Définit les contrats d'API pour les commentaires ancrés par ligne, les réponses hiérarchiques et le statut de résolution, validés par schémas Zod côté serveur.

---

## 1. Liste des Commentaires

### `GET /api/songs/:id/comments`
Récupère l'ensemble des commentaires ouverts et résolus d'un texte.

- **Garde** : `requireAuth` + `can(user, song, 'read')`.
- **Query Params** :
  - `status` (optionnel) : `open` | `resolved` | `all` (défaut : `open`).
- **Réponse (200 OK)** :
  ```json
  {
    "comments": [
      {
        "id": "comment_1",
        "content": "Cette assonance en 'an' passe bien avec le kick.",
        "startLine": 12,
        "endLine": 14,
        "isResolved": false,
        "resolvedBy": null,
        "resolvedAt": null,
        "author": {
          "id": "usr_collab_2",
          "displayName": "Booba",
          "avatarUrl": null
        },
        "createdAt": "2026-10-06T08:00:00.000Z",
        "replies": [
          {
            "id": "reply_1",
            "content": "@Booba Je valide, je la double au refrain.",
            "author": {
              "id": "usr_owner_1",
              "displayName": "Ali",
              "avatarUrl": null
            },
            "createdAt": "2026-10-06T08:05:00.000Z"
          }
        ]
      }
    ]
  }
  ```

---

## 2. Création de Commentaire Ancré

### `POST /api/songs/:id/comments`
Crée un nouveau fil de discussion ancré sur une plage de lignes.

- **Garde** : `requireAuth` + `can(user, song, 'comment')`.
- **Rate Limit** : 30 commentaires / minute par utilisateur.
- **Corps de requête (`createCommentSchema`)** :
  ```json
  {
    "content": "Modifier la fin de la rime pour plus d'impact.",
    "startLine": 16,
    "endLine": 16
  }
  ```
- **Validation Zod** :
  - `content` : chaîne non vide, max 2000 caractères, assainie contre les injections HTML.
  - `startLine` et `endLine` : entiers positifs, `startLine <= endLine`.
- **Réponse (201 Created)** : objet commentaire complet avec auteur.

---

## 3. Réponses aux Commentaires

### `POST /api/comments/:id/replies`
Ajoute une réponse dans un fil existant.

- **Garde** : `requireAuth` + `can(user, comment, 'comment')`.
- **Corps de requête (`createReplySchema`)** :
  ```json
  {
    "content": "Je propose plutôt : 'Dans l'arène comme un gladiateur'."
  }
  ```
- **Réponse (201 Created)** : objet réponse complet.

---

## 4. Résolution & Réouverture

### `PATCH /api/comments/:id/resolve`
Marque un commentaire et ses réponses comme résolus.

- **Garde** : `requireAuth` + `can(user, comment, 'resolve')` (auteur du commentaire, co-auteur ou propriétaire).
- **Réponse (200 OK)** :
  ```json
  {
    "id": "comment_1",
    "isResolved": true,
    "resolvedById": "usr_owner_1",
    "resolvedAt": "2026-10-06T08:15:00.000Z"
  }
  ```

---

### `PATCH /api/comments/:id/reopen`
Rouvre un commentaire précédemment résolu.

- **Garde** : `requireAuth` + `can(user, comment, 'resolve')`.
- **Réponse (200 OK)** : `isResolved: false`.

---

## 5. Suppression de Commentaire

### `DELETE /api/comments/:id`
Supprime un commentaire ou une réponse (réservé à l'auteur du message ou au propriétaire de l'œuvre).

- **Garde** : `requireAuth` + `can(user, comment, 'delete')`.
- **Réponse (204 No Content)**.
