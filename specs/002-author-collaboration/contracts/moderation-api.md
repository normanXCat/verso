# API Contract: Modération, Confidentialité & Recherche d'Utilisateurs

Définit les contrats d'API pour la recherche d'artistes protégée contre l'énumération, le blocage mutuel d'utilisateurs et le signalement d'abus, conformément au Principe II de la Constitution v2.0.0.

---

## 1. Recherche d'Utilisateurs (Anti-Énumération)

### `GET /api/users/search`
Permet de rechercher un utilisateur spécifique pour lui adresser une invitation.

- **Garde** : `requireAuth`.
- **Rate Limit** : 10 requêtes / minute par utilisateur.
- **Query Params** :
  - `q` : chaîne exacte (longueur minimale : 3 caractères).
- **Logique métier stricte** :
  - Recherche par correspondance exacte insensible à la casse sur `username` OU `email`.
  - Aucune recherche partielle par préfixe ni auto-complétion globale.
  - Si l'un des deux utilisateurs a bloqué l'autre, la recherche renvoie un résultat vide.
  - **L'adresse email n'apparaît JAMAIS dans la réponse**.
- **Réponse (200 OK)** :
  ```json
  {
    "users": [
      {
        "id": "usr_collab_2",
        "username": "booba",
        "displayName": "B2O",
        "avatarUrl": "https://s3.verso.app/avatars/b2o.png"
      }
    ]
  }
  ```
- **Erreurs** :
  - `400 Bad Request` : paramètre `q` manquant ou inférieur à 3 caractères.
  - `429 Too Many Requests` : quota de rate limit dépassé.

---

## 2. Blocage d'Utilisateur

### `POST /api/users/:id/block`
Bloque immédiatement un utilisateur indésirable.

- **Garde** : `requireAuth`.
- **Paramètre d'URL** : `:id` (identifiant de l'utilisateur à bloquer).
- **Effets immédiats atomiques** :
  1. Révocation immédiate de tout accès de l'utilisateur bloqué sur les textes et albums du bloqueur (`status: REVOKED`).
  2. Retrait immédiat du bloqueur de tous les projets détenus par l'utilisateur bloqué (`status: LEFT`).
  3. Neutralisation mutuelle des mentions et notifications directes sur les œuvres d'un tiers partagées en commun.
- **Réponse (200 OK)** :
  ```json
  {
    "status": "BLOCKED",
    "blockedUserId": "usr_collab_2"
  }
  ```

---

### `DELETE /api/users/:id/block`
Lève le blocage d'un utilisateur précédemment bloqué.

- **Garde** : `requireAuth`.
- **Réponse (204 No Content)**.

---

### `GET /api/users/blocks`
Liste les utilisateurs actuellement bloqués par l'utilisateur connecté.

- **Garde** : `requireAuth`.
- **Réponse (200 OK)** :
  ```json
  {
    "blockedUsers": [
      {
        "id": "usr_collab_2",
        "username": "troll_user",
        "displayName": "Troll",
        "blockedAt": "2026-10-06T09:00:00.000Z"
      }
    ]
  }
  ```

---

## 3. Signalement d'Abus

### `POST /api/reports`
Transmet un signalement d'abus confidentiel à l'équipe de modération.

- **Garde** : `requireAuth`.
- **Rate Limit** : 5 signalements / heure par utilisateur.
- **Corps de requête (`createReportSchema`)** :
  ```json
  {
    "reason": "HARASSMENT", // "HARASSMENT" | "SPAM" | "INAPPROPRIATE_CONTENT" | "COPYRIGHT_INFRINGEMENT" | "OTHER"
    "details": "Commentaires répétés insultants dans le texte.",
    "reportedUserId": "usr_troll_3",
    "songId": "cuid_song_456",
    "commentId": "comment_1"
  }
  ```
- **Validation Zod** :
  - `reason` : enum `ReportReason`.
  - `details` : texte optionnel assaini, max 1000 caractères.
  - Au moins un identifiant contextuel (`reportedUserId`, `songId` ou `commentId`) fourni.
- **Réponse (201 Created)** :
  ```json
  {
    "id": "rep_123",
    "status": "PENDING",
    "createdAt": "2026-10-06T09:15:00.000Z"
  }
  ```
