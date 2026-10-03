# Verso — Journal de Passation (HANDOFF)

## État actuel

- **Phase en cours** : Phase 1 Achevée (100%) — Prêt pour la Phase 2 (Authentification email & sessions).
- **Ce qui est terminé** :
  - Ratification de la constitution du projet ([.specify/memory/constitution.md](file:///home/normanxcat/Lab/verso/.specify/memory/constitution.md) en version `1.1.0`) avec ses 7 principes non négociables.
  - Spécification fonctionnelle complète de la plateforme Verso ([specs/001-verso-core/spec.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/spec.md)) avec checklist validée à 100% (16/16).
  - Clarification interactive (`/speckit-clarify`) sur les 5 points critiques (bannière email non bloquante, liaison OAuth sécurisée par mot de passe, quotas audio 75 Mo / 3 pistes, gestion des conflits hors ligne par duplication, rétention permanente des versions).
  - Planification d'implémentation technique complète (`/speckit-plan`) et analyse de cohérence (`/speckit-analyze`).
  - Découpage complet des tâches d'implémentation ([specs/001-verso-core/tasks.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/tasks.md)) en 13 phases testables isolément (62 tâches).
  - **Phase 1 (Base du projet, Docker, CI, schéma Prisma) 100% implémentée et testée (T001 à T009)** :
    - Monorepo pnpm initialisé (`package.json`, `pnpm-workspace.yaml`, `.npmrc`).
    - Services locaux dans `docker-compose.yml` (PostgreSQL 16, MinIO S3 avec bucket `verso-audio`) et `.dockerignore`.
    - Pipeline CI GitHub Actions (`.github/workflows/ci.yml`) automatisant lint, format, typecheck et tests.
    - Outillage de qualité zéro warning (`eslint.config.js` Flat Config, `.prettierrc`, `.prettierignore`, `tsconfig.base.json`).
    - Package logique partagée `packages/shared` (`@verso/shared`) avec support Zod.
    - Application backend Fastify `apps/api` (`@verso/api`) avec plugins de sécurité (cookie, cors, helmet, rate-limit).
    - Application frontend React 18 `apps/web` (`@verso/web`) avec Vite, Tailwind CSS, TanStack Query et React Router.
    - Schéma Prisma complet et migration initiale PostgreSQL appliquée (`20261003134155_init`, 13 tables relationnelles).
    - Validateur Zod des variables d'environnement (`apps/api/src/config/env.ts`), tests unitaires Vitest et `.env.example`.
  - Branche `dev` active et synchronisée avec `origin/dev`.
- **Ce qui est en cours** :
  - Phase 1 terminée avec succès, arrêt pour validation utilisateur avant passage à la Phase 2.
- **Ce qui reste à faire** :
  - **Phase 2 : Authentification email et sessions (T010 à T018)** :
    - Schémas Zod d'auth (`packages/shared`), tests d'intégration, service Argon2id, service sessions PostgreSQL en cookies HttpOnly, service email, routes Fastify, interfaces React et bannière persistante.
  - **Phases 3 à 6 (Socle P1)** : OAuth Google/ORCID, Espace personnel, Éditeur CodeMirror 6, Albums et dnd-kit.
  - **Phases 7 à 10 (Confort P2)** : Historique des versions, Audio S3/Boucle/BPM/Métronome, Syllabes/Rimes, Export PDF/Partages.
  - **Phases 11 à 13 (P3 & Finitions)** : PWA hors ligne, Freestyle vocal, Dictionnaire de rimes, Polissage et audit sécurité.

## Dernière action

- **Action exécutée** : Implémentation et validation complète de la Phase 1 (T001 à T009) avec passage de tous les tests (`vitest`), vérification de typage (`tsc --noEmit`), lint zéro warning (`eslint .`) et formatage Prettier.
- **Résultat** : Socle monorepo, Docker, CI, bases de données PostgreSQL/Prisma et configurations opérationnels.

## Décisions prises

- **Structure Monorepo (`apps/web`, `apps/api`, `packages/shared`)** : Permet de partager les schémas Zod, les types et le moteur poétique sans duplication de code.
- **Backend Fastify + Prisma + PostgreSQL** : Performance brute supérieure, écosystème de plugins sécurisé (`@fastify/cookie`, `@fastify/rate-limit`, `@fastify/csrf-protection`).
- **Éditeur CodeMirror 6** : Architecture basée sur des décorations d'état asynchrones idéales pour les gouttières de syllabes et le surlignage de rimes sans bloquer la saisie.
- **Stockage S3 découplé avec URLs présignées** : MinIO en local, Cloudflare R2 en production, téléversement direct sans transiter par la mémoire du serveur applicatif.
- **Persistance locale IndexedDB + Service Worker** : Garantit une écriture continue sans risque de perte même en mode hors ligne.
- **Découpage en 13 phases strictement isolées** : Chaque phase dispose de son propre critère de test indépendant pour une progression incrémentale vérifiable.

## Branche et dernier commit

- **Branche active** : `dev`
- **Dernier commit** : `9ada1d7` — `feat: planification technique complète de Verso Core (plan, research, data-model, contracts, quickstart)`

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

- **Commande recommandée** : `/speckit-implement` pour la Phase 2 (Authentification email et sessions, T010 à T018).
- **Prompt recommandé** :
  ```text
  /speckit-implement Implémente la phase 2 (authentification email et sessions, T010 à T018). Lance lint et tests. Commite après chaque tâche terminée avec un message Conventional Commits en français, pousse sur dev, puis résume pour validation.
  ```
