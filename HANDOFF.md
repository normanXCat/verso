# Verso — Journal de Passation (HANDOFF)

## État actuel

- **Phase en cours** : Phase 2 — Planification Technique Validée & Préparation des Tâches (`speckit-tasks`).
- **Ce qui est terminé** :
  - Ratification de la constitution du projet ([.specify/memory/constitution.md](file:///home/normanxcat/Lab/verso/.specify/memory/constitution.md) en version `1.1.0`) avec ses 7 principes non négociables.
  - Spécification fonctionnelle complète de la plateforme Verso ([specs/001-verso-core/spec.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/spec.md)) avec checklist validée à 100% (16/16).
  - Clarification interactive (`/speckit-clarify`) sur les 5 points critiques (bannière email non bloquante, liaison OAuth sécurisée par mot de passe, quotas audio 75 Mo / 3 pistes, gestion des conflits hors ligne par duplication, rétention permanente des versions).
  - Planification d'implémentation technique complète (`/speckit-plan`) comprenant :
    - [plan.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/plan.md) : Plan d'implémentation global, Technical Context et Constitution Check (100% conforme).
    - [research.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/research.md) : Choix technologiques validés (CodeMirror 6, Fastify, Argon2id, Arctic, MinIO/R2, PWA IndexedDB, lyrics-engine).
    - [data-model.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/data-model.md) : Schéma Prisma complet pour PostgreSQL (User, Account, Session, EmailToken, Album, Song, SongVersion, Tag, SongTag, Instrumental, ShareLink, VoiceNote).
    - [contracts/](file:///home/normanxcat/Lab/verso/specs/001-verso-core/contracts/) : Contrats d'API REST Zod exhaustifs (`auth-api.md`, `songs-api.md`, `albums-api.md`, `audio-api.md`).
    - [quickstart.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/quickstart.md) : 5 scénarios de validation exécutables de bout en bout et commandes de test.
  - Branche `dev` active et synchronisée avec `origin/dev`.
- **Ce qui est en cours** :
  - Clôture de la planification et transition vers la génération des tâches ordonnancées pour le socle P1.
- **Ce qui reste à faire** :
  - **[P1 - Socle Indispensable]** :
    - Exécution de `/speckit-tasks` pour découper l'implémentation en tâches atomiques avec graphe de dépendances.
    - Initialisation du monorepo (`apps/api`, `apps/web`, `packages/shared`, `docker-compose.yml`).
    - Implémentation du backend (Fastify, Prisma, Auth Argon2id, sessions cookies, routes songs/albums).
    - Implémentation du frontend (React, Tailwind, CodeMirror, sauvegarde continue, dnd-kit pour albums).
    - Exécution et validation de la suite de tests (Vitest, lint zéro-warning).
  - **[P2 - Confort d'Écriture & Musique]** (après stabilisation complète de P1) :
    - Moteur métrique de syllabes et rimes, lecteur audio avec boucle et BPM, export PDF horodaté, liens de partage privés.
  - **[P3 - Partage & Bonus]** (après stabilisation complète de P2) :
    - PWA installable offline avec synchronisation, mémos vocaux freestyle, dictionnaire de rimes françaises.

## Dernière action

- **Action exécutée** : Exécution de `/speckit-plan` produisant l'ensemble des artefacts techniques de Phase 0 et Phase 1 (`plan.md`, `research.md`, `data-model.md`, les 4 contrats d'API et `quickstart.md`).
- **Résultat** : Architecture technique intégralement conçue, documentée et prête pour le découpage en tâches de réalisation.

## Décisions prises

- **Structure Monorepo (`apps/web`, `apps/api`, `packages/shared`)** : Permet de partager les schémas Zod, les types et le moteur poétique sans duplication de code.
- **Backend Fastify + Prisma + PostgreSQL** : Performance brute supérieure, écosystème de plugins sécurisé (`@fastify/cookie`, `@fastify/rate-limit`, `@fastify/csrf-protection`).
- **Éditeur CodeMirror 6** : Architecture basée sur des décorations d'état asynchrones idéales pour les gouttières de syllabes et le surlignage de rimes sans bloquer la saisie.
- **Stockage S3 découplé avec URLs présignées** : MinIO en local, Cloudflare R2 en production, téléversement direct sans transiter par la mémoire du serveur applicatif.
- **Persistance locale IndexedDB + Service Worker** : Garantit une écriture continue sans risque de perte même en mode hors ligne.

## Branche et dernier commit

- **Branche active** : `dev`
- **Dernier commit** : `6ed64e3` — `docs: clarification de la spécification de Verso Core (5 décisions clés)`

## Comment lancer le projet

Le code applicatif sera matérialisé lors de l'implémentation de P1.

### Commandes actuelles disponibles

```bash
# Vérifier la branche active (dev ou feature)
git branch --show-current

# Vérifier la syntaxe des scripts bash
bash -n .specify/scripts/bash/*.sh

# Consulter le plan d'implémentation et les contrats
cat specs/001-verso-core/plan.md
ls -la specs/001-verso-core/contracts
```

### Commandes cibles (dès l'initialisation du monorepo)

```bash
# Lancement de la base PostgreSQL et de MinIO en local
docker compose up -d

# Installation des dépendances du monorepo
pnpm install

# Application des migrations Prisma
pnpm --filter @verso/api exec prisma migrate dev

# Lancement des serveurs de développement (API + Web)
pnpm dev

# Tests unitaires et d'intégration
pnpm test

# Contrôle qualité (strict TypeScript et zéro warning ESLint)
pnpm typecheck
pnpm lint
```

## Variables d'environnement

Seuls les noms des variables prévues par l'architecture sont documentés (aucune valeur ni secret) :

- `DATABASE_URL` : URL de connexion PostgreSQL pour Prisma ORM.
- `SESSION_SECRET` : Clé secrète de signature et chiffrement des cookies de session HttpOnly.
- `PORT` : Port d'écoute du serveur backend Fastify.
- `NODE_ENV` : Mode d'exécution (`development`, `test`, `production`).
- `CLIENT_URL` : Origine autorisée pour la politique CORS et les redirections client.
- `S3_ENDPOINT` : Point de terminaison du service de stockage d'objets compatible S3 (MinIO/R2).
- `S3_REGION` : Région du bucket S3.
- `S3_BUCKET_NAME` : Nom du compartiment de stockage pour les fichiers audio.
- `S3_ACCESS_KEY_ID` : Identifiant de la clé d'accès S3.
- `S3_SECRET_ACCESS_KEY` : Clé secrète d'accès S3.
- `GOOGLE_CLIENT_ID` : Identifiant client OAuth Google.
- `GOOGLE_CLIENT_SECRET` : Secret client OAuth Google.
- `ORCID_CLIENT_ID` : Identifiant client OAuth ORCID.
- `ORCID_CLIENT_SECRET` : Secret client OAuth ORCID.

## Problèmes connus et points d'attention

- Le code source applicatif sera généré lors de la phase d'implémentation (`speckit-implement`) ; le dépôt contient actuellement l'outillage Spec Kit, la constitution, la spécification validée et le plan technique complet.
- Toujours vérifier que la branche active est `dev` ou une branche de fonctionnalité avant toute modification.
- Ne jamais commiter de fichier `.env`, de secret ni de fichier audio de test.
- Respecter scrupuleusement le protocole de fin de tâche dans l'ordre strict des 6 étapes.
- Règle de transition stricte : ne pas entamer P2 tant que P1 n'est pas stable et testé.

## Prochaine étape

- **Commande recommandée** : `/speckit-tasks` pour générer le plan de tâches ordonnancé et détaillé de l'implémentation du socle P1.
- **Prompt recommandé** :
  ```text
  /speckit-tasks Découper l'implémentation technique du socle P1 en tâches unitaires, ordonnancées avec dépendances (Monorepo, Fastify, Prisma, Auth, Éditeur de texte, Albums)
  ```
