# Quickstart: Validation de la Collaboration entre Auteurs

Ce guide détaille les scénarios d'intégration exécutables de bout en bout pour valider l'ensemble des fonctionnalités de collaboration conformément à la spécification [`specs/002-author-collaboration/spec.md`](file:///home/normanxcat/Lab/verso/specs/002-author-collaboration/spec.md) et aux contrats d'API associés.

---

## 1. Prérequis & Environnement de Test

```bash
# Vérifier que les conteneurs PostgreSQL et MinIO sont démarrés
docker compose up -d

# Appliquer les migrations de base de données
pnpm --filter @verso/api exec prisma migrate dev

# Lancer la suite de tests automatisée
pnpm test
```

---

## 2. Scénarios de Validation de Bout en Bout

### Scénario 1 : Cycle d'Invitation et Contrôle d'Accès Sécurisé (P1)
**Objectif** : Prouver qu'un propriétaire peut inviter un co-auteur, que l'invitation requiert une acceptation explicite, et que les permissions sont inviolables.

1. **Création de deux comptes d'artistes** :
   - Artiste 1 (`ali@verso.fr`, username `ali`).
   - Artiste 2 (`booba@verso.fr`, username `booba`).
2. **Création d'un texte** par `ali` :
   - `POST /api/songs` → ID `song_1`, titre *"Temps Mort"*, paroles *"Dans l'arène..."*, `revision: 1`.
3. **Tentative d'accès non autorisé** par `booba` :
   - `GET /api/songs/song_1` avec la session de `booba` → **HTTP 404 Not Found** (anti-fuite constitutionnelle).
4. **Envoi d'invitation** par `ali` :
   - `POST /api/songs/song_1/invitations` avec `{ "identifier": "booba", "role": "CO_AUTHOR" }`.
   - Vérifier en base : token haché, expiration à `now + 7 jours`, statut `PENDING`.
5. **Consultation et acceptation** par `booba` :
   - `GET /api/invitations` → l'invitation apparaît dans la liste.
   - `POST /api/invitations/:token/accept` → **HTTP 200 OK**, statut `ACCEPTED`.
6. **Vérification d'accès et espace partagé** :
   - `GET /api/shared/songs` pour `booba` → *"Temps Mort"* est présent avec le rôle `CO_AUTHOR`.
   - `GET /api/songs/song_1` pour `booba` → accès autorisé, texte complet retourné.

---

### Scénario 2 : Commentaires Ancrés, Réponses et Résolution (P1)
**Objectif** : Valider l'échange critique sur des vers précis et le cycle de vie de résolution.

1. **Dépôt d'un commentaire** par `booba` sur la ligne 1 :
   - `POST /api/songs/song_1/comments` avec `{ "content": "Ajouter plus d'impact sur la rime.", "startLine": 1, "endLine": 1 }`.
   - Vérifier : commentaire créé, notification SSE et email émises à destination d'`ali`.
2. **Réponse dans le fil** par `ali` avec mention :
   - `POST /api/comments/:commentId/replies` avec `{ "content": "@booba C'est corrigé sur le couplet suivant." }`.
   - Vérifier : réponse rattachée chronologiquement, notification émise à `booba`.
3. **Résolution du commentaire** :
   - `PATCH /api/comments/:commentId/resolve` → `isResolved: true`, `resolvedById: ali`.
   - `GET /api/songs/song_1/comments?status=open` → le commentaire n'apparaît plus dans les discussions actives.
   - `GET /api/songs/song_1/comments?status=all` → le commentaire est archivé avec l'historique complet.

---

### Scénario 3 : Conflit d'Édition Asynchrone & Zéro Perte (P1)
**Objectif** : Prouver qu'une écriture simultanée asynchrone ne détruit jamais de vers.

1. `ali` et `booba` ouvrent simultanément le texte à la `revision: 1`.
2. `ali` enregistre une modification :
   - `PATCH /api/songs/song_1` avec `{ "lyrics": "Version d'Ali", "expectedRevision": 1 }`.
   - **HTTP 200 OK**, `revision` passe à `2`, `SongVersion` créée avec `authorId: ali`.
3. `booba` tente d'enregistrer sa propre version concurrente sans avoir rafraîchi :
   - `PATCH /api/songs/song_1` avec `{ "lyrics": "Version de Booba", "expectedRevision": 1 }`.
   - **HTTP 409 Conflict**.
4. **Vérification de la conciliation automatique** :
   - Le texte en base conserve le contenu *"Version d'Ali"*.
   - Une `SongVersion` spéciale portant `isConflict: true`, `authorId: booba`, et le texte *"Version de Booba"* est archivée dans l'historique.
   - Le client reçoit le `409 Conflict` et présente le volet de comparaison côte à côte sans aucune perte de frappe.

---

### Scénario 4 : Déclaration des Crédits et Export PDF d'Antériorité (P2)
**Objectif** : Valider l'attribution des droits d'auteurs et leur inscription fidèle dans le certificat PDF.

1. **Déclaration des parts** par `ali` :
   - `PUT /api/songs/song_1/credits` avec :
     - `{ "name": "Ali", "role": "AUTHOR", "percentage": 50 }`
     - `{ "name": "Booba", "role": "AUTHOR", "percentage": 50 }`
     - `{ "name": "Géraldo", "role": "PRODUCER", "percentage": null }`
   - Vérifier : somme des parts calculée à 100%.
2. **Génération de l'export PDF** :
   - `GET /api/songs/song_1/export/pdf` → flux `application/pdf`.
   - Vérifier : le document imprimé comporte le cartouche d'antériorité avec les 3 contributeurs, leurs rôles et pourcentages respectifs.

---

### Scénario 5 : Modération, Confidentialité et Blocage Mutuel (P2)
**Objectif** : Prouver l'étanchéité des profils (zéro fuite d'email) et l'effet immédiat du blocage.

1. **Recherche sans fuite d'email** :
   - `GET /api/users/search?q=booba@verso.fr` → renvoie `{ id, username: "booba", displayName: "B2O" }`.
   - Vérifier : **aucun champ `email` présent dans la réponse**.
2. **Déclenchement du blocage** par `ali` :
   - `POST /api/users/:boobaId/block` → **HTTP 200 OK**.
3. **Vérification des ruptures automatiques** :
   - L'accès de `booba` sur `song_1` passe en statut `REVOKED`.
   - `GET /api/songs/song_1` par `booba` → **HTTP 404 Not Found**.
   - `GET /api/users/search?q=ali` par `booba` → résultat vide (`[]`).
