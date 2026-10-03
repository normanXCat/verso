# Guide de Validation Rapide (Quickstart): Verso Core Platform

Ce guide décrit les scénarios de validation exécutables de bout en bout pour vérifier le fonctionnement de la plateforme Verso, de l'inscription à la rédaction avec instrumentale et partage.

---

## 1. Prérequis & Environnement de Test Local

1. **Docker Compose** : Conteneurs locaux pour PostgreSQL 16 et MinIO (compatible S3).
   ```bash
   docker compose up -d
   ```
2. **Variables d'environnement** : Copie du fichier modèle vers `.env` (sans secrets sensibles) :
   ```bash
   cp .env.example .env
   ```
3. **Installation & Migrations** :
   ```bash
   pnpm install
   pnpm --filter @verso/api exec prisma migrate dev
   ```
4. **Lancement en mode développement** :
   ```bash
   pnpm dev
   ```
   - Frontend : `http://localhost:5173`
   - Backend API : `http://localhost:3000`
   - Console MinIO : `http://localhost:9001`

---

## 2. Scénarios de Validation de Bout en Bout

### Scénario 1 : Inscription, Accès Immédiat & Vérification d'Email (P1)

1. **Action** : Naviguer sur `http://localhost:5173/register`, renseigner :
   - Email : `test-artiste@verso.fr`
   - Mot de passe : `MonRapSolide2026!`
   - Nom d'artiste : `MC Test`
2. **Résultat Attendu** :
   - Le compte est créé.
   - L'utilisateur est immédiatement redirigé vers son espace d'écriture personnel sans être bloqué.
   - Une bannière jaune/avertissement persistante s'affiche en haut de l'écran : *"Veuillez vérifier votre adresse email pour sécuriser votre compte"*.
   - Le cookie de session `session_id` est positionné avec les attributs `HttpOnly`, `SameSite=Lax`.
3. **Action** : Ouvrir le lien de vérification reçu dans la boîte locale de test (ou via logs backend).
4. **Résultat Attendu** :
   - L'email est validé en base (`emailVerified` renseigné).
   - La bannière d'avertissement disparaît instantanément.

---

### Scénario 2 : Rédaction avec Sauvegarde Continue & Compteurs (P1)

1. **Action** : Cliquer sur "Nouveau texte". Saisir :
   - Titre : `Session Studio 01`
   - Paroles :
     ```text
     Dans le noir je pose les premiers accords
     Chaque mot résonne jusqu'à l'aurore
     ```
2. **Résultat Attendu** :
   - L'indicateur discret de statut passe de *"Enregistrement..."* à *"Enregistré"* en moins de 500 ms.
   - Le compteur affiche exactement : `2 lignes`, `14 mots`.
   - Recharger la page : le texte et le titre sont intégralement restaurés sans perte.
3. **Simulation Coupure Réseau** :
   - Passer l'onglet en mode "Offline" via les DevTools du navigateur.
   - Continuer la frappe de deux nouvelles lignes.
   - L'éditeur ne bloque pas et stocke la frappe dans IndexedDB.
   - Rétablir le réseau : la synchronisation distante `PATCH /api/songs/:id` s'exécute automatiquement en tâche de fond.

---

### Scénario 3 : Structuration d'un Album & Glisser-Déposer (P1)

1. **Action** : Se rendre dans l'onglet "Albums" et cliquer sur "Nouvel album".
   - Titre : `Premier Jet`
2. **Action** : Associer `Session Studio 01` et un second morceau `Phase Deux` à cet album.
3. **Action** : Dans la vue détaillée de l'album, inverser l'ordre des morceaux par glisser-déposer (dnd-kit).
4. **Résultat Attendu** :
   - L'appel `PUT /api/albums/:id/tracks/reorder` met à jour les positions en base.
   - Rafraîchir la page : l'ordre réorganisé est fidèlement conservé.
5. **Action** : Supprimer l'album `Premier Jet`.
6. **Résultat Attendu** :
   - L'album disparaît.
   - Les morceaux `Session Studio 01` et `Phase Deux` sont toujours présents dans l'espace personnel avec `album: null` (zéro suppression de texte).

---

### Scénario 4 : Association d'une Instrumentale avec Boucle & BPM (P2)

1. **Action** : Ouvrir `Session Studio 01`. Cliquer sur "Ajouter une instru".
2. **Action** : Sélectionner un fichier WAV de 45 Mo.
3. **Résultat Attendu** :
   - Le client obtient une URL de téléversement présignée S3 et pousse le fichier vers MinIO.
   - L'instru apparaît dans le lecteur avec son titre et sa durée.
4. **Action** : Renseigner `BPM: 92`, activer le métronome et définir une boucle entre 0:15 et 0:45.
5. **Résultat Attendu** :
   - Le lecteur audio joue en continu le segment 0:15 - 0:45 sans à-coup pendant que l'utilisateur tape du texte.

---

### Scénario 5 : Exportation PDF & Partage Privé Révocable (P2)

1. **Action** : Cliquer sur "Exporter en PDF".
2. **Résultat Attendu** :
   - Le navigateur télécharge `session-studio-01-verso.pdf`.
   - Le document contient le texte, le nom d'artiste, et la mention horodatée exacte de la dernière révision.
3. **Action** : Cliquer sur "Partager" et générer un lien privé.
4. **Résultat Attendu** :
   - Un lien unique de type `https://verso.app/share/sec_...` est généré.
   - Ouvrir ce lien dans une fenêtre de navigation privée : le texte s'affiche en lecture seule sobre, sans option de modification et sans métadonnées personnelles de l'auteur.
5. **Action** : Depuis la session auteur, cliquer sur "Révoquer le lien".
6. **Résultat Attendu** :
   - Recharger la fenêtre privée : le lien renvoie immédiatement un message neutre *"Ce lien n'est plus actif"*.

---

## 3. Commandes de Test Automatisées

```bash
# Lancement de l'ensemble des tests unitaires et composants
pnpm test

# Lancement des tests du moteur métrique de rimes et syllabes
pnpm --filter @verso/shared test

# Lancement des tests d'intégration des routes d'API
pnpm --filter @verso/api test:integration

# Validation du typage strict et du linting (zéro warning)
pnpm typecheck
pnpm lint
```
