# API Contract: Collaboration & Invitations

Définit les contrats d'API pour la gestion des invitations, des rôles et de l'espace « Partagés avec moi », validés par schémas Zod côté serveur.

---

## 1. Invitations

### `POST /api/songs/:id/invitations` & `POST /api/albums/:id/invitations`
Invite un utilisateur à collaborer sur un texte ou un album.

- **Garde** : `requireAuth` + `can(user, song, 'invite')` (propriétaire uniquement).
- **Rate Limit** : 20 requêtes / minute par utilisateur.
- **Corps de requête (`createInvitationSchema`)** :
  ```json
  {
    "identifier": "blaze_ou_email@artiste.fr",
    "role": "CO_AUTHOR" // "CO_AUTHOR" | "COMMENTER" | "READER"
  }
  ```
- **Réponse (201 Created)** :
  ```json
  {
    "id": "cuid_inv_123",
    "role": "CO_AUTHOR",
    "status": "PENDING",
    "invitedUsername": "booba",
    "expiresAt": "2026-10-13T09:00:00.000Z",
    "shareUrl": "https://verso.app/invitations/sec_abc123xyz"
  }
  ```
- **Erreurs** :
  - `400 Bad Request` : données invalides ou utilisateur déjà collaborateur actif.
  - `404 Not Found` : texte introuvable ou droits insuffisants (anti-fuite).
  - `429 Too Many Requests` : rate limit atteint.

---

### `GET /api/invitations`
Liste les invitations reçues en attente par l'utilisateur connecté.

- **Garde** : `requireAuth`.
- **Réponse (200 OK)** :
  ```json
  {
    "invitations": [
      {
        "id": "cuid_inv_123",
        "role": "CO_AUTHOR",
        "resourceType": "song",
        "resourceTitle": "Nouveau Monde",
        "inviter": {
          "displayName": "Oxmo",
          "avatarUrl": null
        },
        "expiresAt": "2026-10-13T09:00:00.000Z"
      }
    ]
  }
  ```

---

### `POST /api/invitations/:token/accept` & `POST /api/invitations/:token/decline`
Accepte ou refuse explicitement une invitation.

- **Garde** : `requireAuth`.
- **Paramètre d'URL** : `:token` (jeton brut `sec_...`).
- **Réponse Accept (200 OK)** :
  ```json
  {
    "status": "ACCEPTED",
    "resourceType": "song",
    "resourceId": "cuid_song_456",
    "role": "CO_AUTHOR"
  }
  ```
- **Réponse Decline (200 OK)** :
  ```json
  {
    "status": "DECLINED"
  }
  ```
- **Erreurs** :
  - `404 Not Found` : invitation expirée, révoquée ou inexistante (anti-fuite).

---

### `DELETE /api/songs/:id/invitations/:invitationId`
Révoque une invitation en attente.

- **Garde** : `requireAuth` + `can(user, song, 'invite')`.
- **Réponse (204 No Content)**.

---

## 2. Collaborateurs & Gestion des Accès

### `GET /api/songs/:id/collaborators`
Liste tous les collaborateurs et invitations en attente d'un texte.

- **Garde** : `requireAuth` + `can(user, song, 'read')`.
- **Réponse (200 OK)** :
  ```json
  {
    "owner": {
      "id": "usr_owner_1",
      "displayName": "Ali",
      "avatarUrl": null
    },
    "collaborators": [
      {
        "id": "collab_1",
        "userId": "usr_collab_2",
        "displayName": "Booba",
        "avatarUrl": null,
        "role": "CO_AUTHOR",
        "joinedAt": "2026-10-04T12:00:00.000Z"
      }
    ],
    "pendingInvitations": [
      {
        "id": "cuid_inv_123",
        "role": "COMMENTER",
        "identifier": "dj_medhi",
        "expiresAt": "2026-10-13T09:00:00.000Z"
      }
    ]
  }
  ```

---

### `PATCH /api/songs/:id/collaborators/:userId`
Modifie le rôle d'un collaborateur existant.

- **Garde** : `requireAuth` + `can(user, song, 'manage_roles')` (propriétaire uniquement).
- **Corps de requête** :
  ```json
  {
    "role": "COMMENTER" // "CO_AUTHOR" | "COMMENTER" | "READER"
  }
  ```
- **Réponse (200 OK)** :
  ```json
  {
    "userId": "usr_collab_2",
    "role": "COMMENTER"
  }
  ```

---

### `DELETE /api/songs/:id/collaborators/:userId`
Révoque l'accès d'un collaborateur.

- **Garde** : `requireAuth` + `can(user, song, 'manage_roles')` (propriétaire uniquement).
- **Effet** : Accès immédiatement révoqué, paroles conservées, commentaires passés anonymisés.
- **Réponse (204 No Content)**.

---

### `POST /api/songs/:id/collaborators/leave`
Permet à un co-auteur, commentateur ou lecteur de quitter volontairement un texte partagé.

- **Garde** : `requireAuth` + `can(user, song, 'read')` (collaborateur actif, non propriétaire).
- **Réponse (204 No Content)**.

---

## 3. Espace "Partagés avec moi"

### `GET /api/shared/songs`
Récupère les textes partagés avec l'utilisateur connecté.

- **Garde** : `requireAuth`.
- **Query Params** :
  - `role` (optionnel) : `CO_AUTHOR` | `COMMENTER` | `READER`
  - `ownerId` (optionnel) : `string`
  - `q` (optionnel) : recherche plein texte sur titre et paroles
- **Réponse (200 OK)** :
  ```json
  {
    "songs": [
      {
        "id": "cuid_song_456",
        "title": "Temps Mort",
        "snippet": "Le vent souffle sur les cités...",
        "role": "CO_AUTHOR",
        "owner": {
          "id": "usr_owner_1",
          "displayName": "Ali",
          "avatarUrl": null
        },
        "updatedAt": "2026-10-06T08:30:00.000Z"
      }
    ]
  }
  ```
