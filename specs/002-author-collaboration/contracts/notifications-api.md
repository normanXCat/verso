# API Contract: Notifications & Flux Temps Réel (SSE)

Définit les contrats d'API pour la consultation des notifications, le flux en direct Server-Sent Events (SSE) et la gestion fine des préférences de notification.

---

## 1. Consultation des Notifications

### `GET /api/notifications`
Récupère la liste des notifications destinées à l'utilisateur connecté.

- **Garde** : `requireAuth`.
- **Query Params** :
  - `unreadOnly` (optionnel) : `true` | `false` (défaut : `false`).
  - `limit` (optionnel) : max 50 (défaut : 20).
- **Réponse (200 OK)** :
  ```json
  {
    "unreadCount": 2,
    "notifications": [
      {
        "id": "notif_1",
        "type": "INVITATION_RECEIVED",
        "isRead": false,
        "createdAt": "2026-10-06T09:00:00.000Z",
        "actor": {
          "id": "usr_owner_1",
          "displayName": "Ali",
          "avatarUrl": null
        },
        "target": {
          "resourceType": "song",
          "resourceId": "cuid_song_456",
          "title": "Temps Mort"
        }
      },
      {
        "id": "notif_2",
        "type": "COMMENT_ADDED",
        "isRead": false,
        "createdAt": "2026-10-06T09:05:00.000Z",
        "actor": {
          "id": "usr_collab_2",
          "displayName": "Booba",
          "avatarUrl": null
        },
        "target": {
          "resourceType": "comment",
          "resourceId": "comment_1",
          "songId": "cuid_song_456",
          "title": "Temps Mort"
        }
      }
    ]
  }
  ```

---

## 2. Gestion de l'État de Lecture

### `PATCH /api/notifications/:id/read`
Marque une notification spécifique comme lue.

- **Garde** : `requireAuth`.
- **Réponse (200 OK)** : `{ "id": "notif_1", "isRead": true }`.

---

### `POST /api/notifications/read-all`
Marque l'ensemble des notifications de l'utilisateur comme lues.

- **Garde** : `requireAuth`.
- **Réponse (200 OK)** : `{ "markedCount": 5 }`.

---

## 3. Flux Temps Réel Server-Sent Events (SSE)

### `GET /api/notifications/stream`
Établit une connexion persistante unidirectionnelle pour recevoir les alertes en direct sans polling.

- **Garde** : `requireAuth` (authentification par cookie de session).
- **Headers HTTP** :
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`
- **Format des messages émis** :
  ```text
  event: notification
  data: {"id":"notif_3","type":"MENTION","actor":{"displayName":"Booba"},"songTitle":"Temps Mort","songId":"cuid_song_456"}

  event: unread_count
  data: {"count":3}
  ```
- **Heartbeat** : Envoi d'un commentaire `: ping` toutes les 25 secondes pour maintenir la connexion active à travers les proxys.

---

## 4. Préférences de Notifications

### `GET /api/notifications/settings`
Consulte les réglages de délivrance de l'utilisateur.

- **Garde** : `requireAuth`.
- **Réponse (200 OK)** :
  ```json
  {
    "inApp": {
      "invitations": true,
      "comments": true,
      "mentions": true
    },
    "email": {
      "invitations": true,
      "comments": false,
      "mentions": true
    }
  }
  ```

---

### `PUT /api/notifications/settings`
Met à jour les préférences de notifications in-app et emails.

- **Garde** : `requireAuth`.
- **Corps de requête (`updateNotificationSettingsSchema`)** : structure identique à la réponse GET.
- **Réponse (200 OK)** : réglages mis à jour.
