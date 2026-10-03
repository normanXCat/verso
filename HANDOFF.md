# Verso — Journal de Passation (HANDOFF)

## État actuel

- **Phase en cours** : Phase 1 — Spécification Fonctionnelle Réalisée & Préparation de la Planification.
- **Ce qui est terminé** :
  - Ratification de la constitution du projet ([.specify/memory/constitution.md](file:///home/normanxcat/Lab/verso/.specify/memory/constitution.md) en version `1.1.0`) avec ses 7 principes non négociables.
  - Spécification fonctionnelle complète du projet Verso ([specs/001-verso-core/spec.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/spec.md)) couvrant l'intégralité du périmètre fonctionnel découpé par priorité :
    - **P1 (Socle indispensable)** : Compte et authentification maison, vérification email, sessions actives avec révocation, Google/ORCID, espace personnel avec recherche plein texte et filtres, création/modification/suppression de textes avec sauvegarde auto temps réel et compteurs, gestion d'albums avec agencement glisser-déposer.
    - **P2 (Confort d'écriture et musique)** : Historique des versions horodatées avec restauration, compteur de syllabes par ligne, détection et coloration des rimes, mode concentration zen, téléversement d'instrus audio (MP3/WAV), lecteur avec boucle de travail, BPM, tonalité et métronome, export PDF horodaté comme preuve d'antériorité, lien de partage privé révocable en lecture seule.
    - **P3 (Bonus)** : PWA installable avec support complet hors ligne et synchronisation automatique, enregistrement vocal d'un freestyle attaché au texte, dictionnaire de rimes françaises.
  - Validation complète de la checklist de qualité de spécification ([specs/001-verso-core/checklists/requirements.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/checklists/requirements.md)) : zéro ambiguïté, zéro fuite d'implémentation, critères de succès mesurables et agnostiques.
  - Configuration du fichier [.gitignore](file:///home/normanxcat/Lab/verso/.gitignore) (blocage strict de `.env`, secrets et médias audio).
  - Branche `dev` configurée et synchronisée avec `origin/dev`.
- **Ce qui est en cours** :
  - Préparation de la phase de planification technique du socle P1 (`/speckit-plan`).
- **Ce qui reste à faire** :
  - **[P1 - Socle Indispensable]** :
    - Exécution de `/speckit-plan` pour concevoir l'architecture technique, le modèle de données Prisma, les contrats d'API et le plan de découpage.
    - Génération de la liste des tâches ordonnancées (`/speckit-tasks`).
    - Implémentation du squelette applicatif (React, Tailwind, Node.js, Prisma, PostgreSQL).
    - Implémentation et tests de l'authentification et de l'éditeur de texte avec sauvegarde continue.
  - **[P2 - Confort d'Écriture & Musique]** (après stabilisation complète de P1) :
    - Historique des versions, métrique des syllabes, lecteur audio avec boucle, stockage S3 externe, export PDF et liens de partage privés.
  - **[P3 - Partage & Bonus]** (après stabilisation complète de P2) :
    - PWA offline (IndexedDB), enregistrement vocal freestyle, dictionnaire de rimes.

## Dernière action

- **Action exécutée** : Exécution de `/speckit-specify` pour formaliser la spécification fonctionnelle complète de la plateforme Verso (`specs/001-verso-core/spec.md`) et validation de la checklist qualité (`requirements.md`).
- **Résultat** : Spécification complète prête pour la planification, enregistrée dans `.specify/feature.json` pointant sur `specs/001-verso-core`.

## Décisions prises

- **Découpage strict en 3 priorités séquentielles (P1 socle, P2 confort/musique, P3 bonus)** : Permet de sécuriser le noyau vital de l'application avant d'aborder les enrichissements multimédias et mobiles.
- **Spécification purement fonctionnelle et agnostique** : Description rigoureuse du comportement utilisateur et des flux métiers sans mentionner de frameworks ou de choix d'implémentation technique.
- **Périmètre v1 délimité** : Exclusion explicite de la collaboration multi-auteurs en temps réel et des partages publics non contrôlés.
- **Textes privés par défaut et partage strictement en lecture seule révocable** : Protection sans compromis de la propriété intellectuelle des artistes.
- **Sauvegarde continue avec zéro perte de données garantie** : Sauvegarde en tâche de fond sous 500 ms après la frappe, résiliente aux coupures réseau.

## Branche et dernier commit

- **Branche active** : `dev`
- **Dernier commit** : `8a9c0e2` — `docs: mise à jour de la constitution v1.1.0 et cadrage des priorités`

## Comment lancer le projet

Le projet est actuellement en phase de spécification fonctionnelle. Le code applicatif sera généré lors de la phase d'implémentation du socle P1.

### Commandes actuelles disponibles

```bash
# Vérifier la branche active (dev ou feature)
git branch --show-current

# Vérifier la syntaxe des scripts Spec Kit
bash -n .specify/scripts/bash/*.sh

# Consulter la spécification courante
cat specs/001-verso-core/spec.md
```

### Commandes cibles (prévues dès l'initialisation du code source)

```bash
# Installation des dépendances
npm install

# Démarrage des conteneurs locaux (PostgreSQL, stockage objet S3)
docker compose up -d

# Exécution des migrations de base de données Prisma
npx prisma migrate dev

# Lancement de l'environnement de développement (frontend + backend)
npm run dev

# Exécution des tests unitaires et d'intégration
npm test

# Contrôle qualité (lint et typage TypeScript strict)
npm run lint
npm run typecheck
```

## Variables d'environnement

Seuls les noms des variables prévues par l'architecture sont documentés (aucune valeur ni secret) :

- `DATABASE_URL` : URL de connexion PostgreSQL pour Prisma ORM.
- `SESSION_SECRET` : Clé secrète de signature et chiffrement des cookies de session HttpOnly.
- `PORT` : Port d'écoute du serveur backend HTTP.
- `NODE_ENV` : Mode d'exécution (`development`, `test`, `production`).
- `CLIENT_URL` : Origine autorisée pour la politique CORS et les redirections client.
- `S3_ENDPOINT` : Point de terminaison du service de stockage d'objets compatible S3.
- `S3_REGION` : Région du bucket S3.
- `S3_BUCKET_NAME` : Nom du compartiment de stockage pour les fichiers audio.
- `S3_ACCESS_KEY_ID` : Identifiant de la clé d'accès S3.
- `S3_SECRET_ACCESS_KEY` : Clé secrète d'accès S3.
- `GOOGLE_CLIENT_ID` : Identifiant client OAuth Google.
- `GOOGLE_CLIENT_SECRET` : Secret client OAuth Google.
- `ORCID_CLIENT_ID` : Identifiant client OAuth ORCID.
- `ORCID_CLIENT_SECRET` : Secret client OAuth ORCID.

## Problèmes connus et points d'attention

- Le code source applicatif (React / Node.js) n'est pas encore initialisé ; le dépôt contient actuellement l'outillage Spec Kit, la constitution et les spécifications sous `specs/`.
- Toujours vérifier que la branche active est `dev` ou une branche de fonctionnalité avant toute modification de fichier.
- Ne jamais commiter de fichier `.env`, de secret ni de fichier audio de test.
- Respecter scrupuleusement le protocole de fin de tâche dans l'ordre strict des 6 étapes.
- Règle de transition stricte : ne pas entamer P2 tant que P1 n'est pas stable et testé.

## Prochaine étape

- **Commande recommandée** : `/speckit-plan` pour lancer la planification de l'implémentation technique du socle P1.
- **Prompt recommandé** :
  ```text
  /speckit-plan Planifier l'implémentation technique du socle P1 (Authentification sécurisée, Espace personnel, Éditeur de texte avec sauvegarde continue, Gestion d'albums)
  ```
