# API Contract: Crédits Artistiques & Répartition

Définit les contrats d'API pour la gestion des crédits d'auteurs, featurings, producteurs et compositeurs, ainsi que leur intégration dans l'export PDF d'antériorité.

---

## 1. Consultation des Crédits

### `GET /api/songs/:id/credits`
Récupère la liste ordonnée des crédits déclarés sur un texte.

- **Garde** : `requireAuth` + `can(user, song, 'read')`.
- **Réponse (200 OK)** :
  ```json
  {
    "credits": [
      {
        "id": "crd_1",
        "name": "Ali",
        "role": "AUTHOR",
        "percentage": 50.0,
        "order": 0,
        "user": {
          "id": "usr_owner_1",
          "displayName": "Ali",
          "avatarUrl": null
        }
      },
      {
        "id": "crd_2",
        "name": "Booba",
        "role": "AUTHOR",
        "percentage": 50.0,
        "order": 1,
        "user": {
          "id": "usr_collab_2",
          "displayName": "Booba",
          "avatarUrl": null
        }
      },
      {
        "id": "crd_3",
        "name": "Géraldo",
        "role": "PRODUCER",
        "percentage": null,
        "order": 2,
        "user": null
      }
    ],
    "totalAuthorPercentage": 100.0
  }
  ```

---

## 2. Déclaration et Mise à Jour des Crédits

### `PUT /api/songs/:id/credits`
Définit ou remplace l'intégralité des crédits d'un texte.

- **Garde** : `requireAuth` + `can(user, song, 'write')` (propriétaire ou co-auteur).
- **Corps de requête (`setCreditsSchema`)** :
  ```json
  {
    "credits": [
      {
        "name": "Ali",
        "role": "AUTHOR", // "AUTHOR" | "FEATURING" | "PRODUCER" | "COMPOSER"
        "percentage": 50.0, // Nombre entre 0 et 100, ou null
        "order": 0
      },
      {
        "name": "Booba",
        "role": "AUTHOR",
        "percentage": 50.0,
        "order": 1
      },
      {
        "name": "Géraldo",
        "role": "PRODUCER",
        "percentage": null,
        "order": 2
      }
    ]
  }
  ```
- **Validation Zod** :
  - `name` : chaîne non vide, max 100 caractères, assainie (neutralisation XSS).
  - `role` : enum `CreditRole`.
  - `percentage` : flottant optionnel `>= 0` et `<= 100`.
- **Réponse (200 OK)** : liste mise à jour des crédits avec `totalAuthorPercentage`.
