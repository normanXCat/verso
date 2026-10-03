# Verso

Un espace d'écriture minimaliste pour rappeurs permettant d'écrire, organiser, protéger et partager leurs textes.

---

## Description

**Verso** est une application web conçue pour les artistes du texte et rappeurs. Elle offre un environnement d'écriture sobre et sans distraction cognitive, garantissant une continuité absolue d'écriture (sauvegarde automatique en temps réel sans perte de données, support hors ligne complet via PWA), une organisation fluide (textes, albums, brouillons, instrus) et une protection stricte des œuvres (textes privés par défaut, partage exclusif par lien privé révocable en lecture seule).

Le projet est régi par une constitution stricte ([.specify/memory/constitution.md](file:///home/normanxcat/Lab/verso/.specify/memory/constitution.md)) qui impose une haute qualité de code, une sécurité sans compromis, une conception ergonomique soignée, une discipline Git rigoureuse et une mise à jour documentaire permanente.

---

## Fonctionnalités & Feuille de Route

Le projet suit un cadre de priorisation séquentiel strict (**P1** socle indispensable → **P2** confort d'écriture et musique → **P3** bonus). Une priorité supérieure n'est abordée que lorsque la précédente est totalement stable et testée.

| Priorité | Fonctionnalité | Statut | Description |
| :---: | :--- | :---: | :--- |
| **Socle** | **Constitution & Gouvernance v1.1.0** | ✅ Fait | 7 principes non négociables inscrits dans la constitution |
| **Socle** | **Discipline Git & Protection des données** | ✅ Fait | Branche `dev`, blocage des `.env`, secrets et audio via `.gitignore` |
| **Socle** | **Documentation & Handoff permanent** | ✅ Fait | `HANDOFF.md` et `README.md` mis à jour avant chaque commit |
| **Socle** | **Outillage Spec Kit** | ✅ Fait | Workflows et scripts de spécification, planification et tâches |
| **Socle** | **Spécification Fonctionnelle Verso Core** | ✅ Fait | Spécification complète et clarifiée ([specs/001-verso-core/spec.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/spec.md)) |
| **Socle** | **Planification Technique Verso Core** | ✅ Fait | Architecture monorepo, schéma Prisma, contrats d'API et quickstart ([specs/001-verso-core/plan.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/plan.md)) |
| **Socle** | **Découpage des Tâches d'Implémentation** | ✅ Fait | 62 tâches en 13 phases ordonnancées, testables et priorisées ([specs/001-verso-core/tasks.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/tasks.md)) |
| **Socle** | **Monorepo & Outillage Qualité (Phase 1)** | ✅ Fait | Monorepo pnpm (`apps/api`, `apps/web`, `packages/shared`), TS strict, ESLint/Prettier zéro warning |

| **Socle** | **Docker & Base PostgreSQL (Phase 1)** | ✅ Fait | Docker Compose (PostgreSQL 16, MinIO S3), schéma Prisma et migration initiale appliquée (13 tables) |
| **Socle** | **CI GitHub Actions (Phase 1)** | ✅ Fait | Pipeline CI automatisé (`.github/workflows/ci.yml`) testant lint, format, typecheck et tests |
| **Socle** | **Design System « Encre & Papier »** | ✅ Fait | Tokens clair/sombre, typographie Fontsource (Instrument Serif, Geist), Framer Motion, page `/design` |
| **Socle** | **Landing Page « Encre & Papier »** | ✅ Fait | Hero asymétrique, feuille signature animée, mockup interactif, studio audio, frise d'antériorité |
| **P1** | **Authentification sécurisée & Sessions** | ✅ Fait | Mots de passe Argon2id, sessions PostgreSQL en cookies HttpOnly/Secure/SameSite=Lax, emails transactionnels, rate limiting |





| **P1** | **Éditeur d'écriture résilient** | ⏳ Prévu | Typographie soignée, sauvegarde automatique en continu, zéro perte de texte |
| **P1** | **Organisation des textes (Privés par défaut)** | ⏳ Prévu | Cloisonnement strict multi-tenant, vérification d'appartenance systématique |
| **P2** | **Application installable (PWA) & Mode Hors Ligne** | ⏳ Prévu | Écriture hors ligne totale (IndexedDB) et synchronisation au retour du réseau |
| **P2** | **Gestion des médias audio (Compatible S3)** | ⏳ Prévu | Fichiers audio stockés hors base, stockage de la clé uniquement en base |
| **P2** | **Organisation avancée des œuvres** | ⏳ Prévu | Structuration par albums, morceaux, couplets et annotations |
| **P3** | **Liens de partage privés révocables** | ⏳ Prévu | Partage explicite en lecture seule, tokens hachés révocables avec expiration et rate limiting |
| **P3** | **OAuth (Google & ORCID)** | ⏳ Prévu | Authentification tierce sécurisée avec state et PKCE |

*(Règle : une fonctionnalité n'est marquée ✅ que si elle est effectivement implémentée et testée dans le code).*

---

## Stack technique

L'architecture technique conçue lors du plan d'implémentation repose sur :

- **Architecture** : Monorepo TypeScript (`apps/web`, `apps/api`, `packages/shared`)
- **Frontend & Direction Artistique** : React 18+, TypeScript, Vite, Tailwind CSS, Framer Motion, typographies auto-hébergées via Fontsource (`Instrument Serif`, `Geist Sans`, `Geist Mono`), React Router, TanStack Query, CodeMirror 6, dnd-kit

- **PWA & Offline** : `vite-plugin-pwa`, Service Workers, IndexedDB (`idb`)
- **Backend** : Node.js (LTS), TypeScript, Fastify v4+ (API REST haute performance)
- **Base de données & ORM** : PostgreSQL 16, Prisma ORM v5+ avec migrations versionnées
- **Stockage Audio** : Compatible S3 (MinIO en développement local, Cloudflare R2 en production) via URLs présignées
- **Sécurité** : Hachage Argon2id, sessions PostgreSQL avec cookies HttpOnly/Secure/SameSite=Lax, Arctic (OAuth Google/ORCID avec PKCE), `@fastify/rate-limit`, `@fastify/csrf-protection`
- **Métrique & Rimes** : Module partagé `lyrics-engine` adapté aux spécificités de la langue française
- **Qualité & Tests** : Vitest, React Testing Library, ESLint et Prettier (zéro warning toléré)

---

## Prérequis

- **Git** (v2.30+)
- **Node.js** (v20+ LTS) et **pnpm** (v9+)
- **Docker & Docker Compose** (pour PostgreSQL et MinIO locaux)

---

## Installation

1. Cloner le dépôt :
   ```bash
   git clone git@github.com:normanXCat/verso.git
   cd verso
   ```

2. Se placer sur la branche de développement :
   ```bash
   git checkout dev
   ```

*(L'installation via `pnpm install` sera opérationnelle dès l'initialisation du monorepo dans l'étape d'implémentation).*

---

## Commandes et Scripts Disponibles

```bash
# Installation des dépendances du monorepo
pnpm install

# Contrôle qualité (ESLint 10 zéro warning et Prettier)
pnpm run lint
pnpm run format:check

# Vérification du typage TypeScript strict sur l'ensemble du monorepo
pnpm run typecheck

# Exécution des tests automatisés (Vitest)
pnpm test

# Lancement des serveurs de développement en parallèle (API + Web)
pnpm dev
```

---

## Structure des dossiers

Voici l'arborescence actuellement présente dans le dépôt :

```text
verso/
├── .github/
│   └── workflows/
│       └── ci.yml              # Pipeline CI GitHub Actions (lint, format, typecheck, tests)
├── apps/
│   ├── api/                    # Backend Fastify + Prisma ORM
│   │   ├── prisma/             # Schéma Prisma et migrations PostgreSQL
│   │   └── src/                # Serveur HTTP, validation Zod env, modules
│   └── web/                    # Frontend React 18 + Vite + Tailwind CSS
│       ├── public/             # Assets statiques
│       └── src/                # App React, routage et styles
├── packages/
│   └── shared/                 # Bibliothèque partagée (@verso/shared)
│       └── src/                # Schémas Zod, types et moteur poétique
├── specs/                      # Spécifications fonctionnelles et techniques
│   └── 001-verso-core/         # Spécification complète et plan de la plateforme Verso
│       ├── checklists/         # Checklist de qualité (16/16)
│       ├── contracts/          # Contrats d'API REST Zod
│       ├── data-model.md       # Modèle relationnel détaillé Prisma / PostgreSQL
│       ├── plan.md             # Plan d'implémentation technique global
│       ├── quickstart.md       # Scénarios de validation exécutables
│       ├── research.md         # Décisions d'architecture
│       ├── spec.md             # Spécification fonctionnelle validée
│       └── tasks.md            # Découpage des 62 tâches ordonnancées
├── .dockerignore               # Exclusion Docker
├── .env.example                # Modèle de variables d'environnement
├── .gitignore                  # Exclusion des dépendances, secrets et médias audio
├── .prettierignore             # Exclusion Prettier
├── .prettierrc                 # Configuration Prettier
├── docker-compose.yml          # Services locaux PostgreSQL 16 et MinIO S3
├── eslint.config.js            # Configuration ESLint Flat Config zéro warning
├── HANDOFF.md                  # Journal de passation et suivi d'état du projet
├── LICENSE                     # Licence du projet (MIT)
├── package.json                # Configuration racine du monorepo
├── pnpm-workspace.yaml         # Configuration du workspace pnpm
├── README.md                   # Documentation principale du projet
└── tsconfig.base.json          # Configuration TypeScript stricte commune
```

---

## Variables d'environnement

Seuls les noms des variables prévues par l'architecture sont documentés (aucun secret ni valeur) :

| Variable | Rôle |
| :--- | :--- |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL pour Prisma ORM |
| `SESSION_SECRET` | Clé secrète pour le chiffrement et la signature des cookies de session |
| `PORT` | Port d'écoute du serveur backend Fastify |
| `NODE_ENV` | Environnement d'exécution (`development`, `test`, `production`) |
| `CLIENT_URL` | Origine autorisée pour la politique CORS et les redirections d'authentification |
| `S3_ENDPOINT` | Point de terminaison du service de stockage d'objets compatible S3 |
| `S3_REGION` | Région géographique du stockage S3 |
| `S3_BUCKET_NAME` | Nom du compartiment de stockage pour les fichiers audio |
| `S3_ACCESS_KEY_ID` | Identifiant d'accès au stockage compatible S3 |
| `S3_SECRET_ACCESS_KEY` | Clé secrète d'accès au stockage compatible S3 |
| `GOOGLE_CLIENT_ID` | Identifiant client de l'application OAuth Google |
| `GOOGLE_CLIENT_SECRET` | Secret client de l'application OAuth Google |
| `ORCID_CLIENT_ID` | Identifiant client de l'application OAuth ORCID |
| `ORCID_CLIENT_SECRET` | Secret client de l'application OAuth ORCID |

---

## Règles de fin de tâche obligatoires

Chaque tâche exécutée DOIT impérativement respecter ce protocole dans l'ordre strict :

1. **Lint et tests** : Lancer le linter et la suite de tests (`npm run lint`, `npm test`, etc.) ; corriger toutes les erreurs avant de continuer.
2. **Documentation obligatoire** : Mettre à jour [HANDOFF.md](file:///home/normanxcat/Lab/verso/HANDOFF.md) (état actuel, dernière action, décisions, branche et dernier commit, comment lancer, variables d'environnement par nom seulement, problèmes connus, prochaine étape) et [README.md](file:///home/normanxcat/Lab/verso/README.md) (fonctionnalités avec statut, stack, installation, lancement, structure). Ne documenter que ce qui existe réellement dans le code.
3. **Discipline de branches** : Ne jamais travailler directement sur `main`. Utiliser la branche courante si ce n'est pas `main`, sinon créer et basculer sur `dev`.
4. **Staging & Commit** : `git add`, puis commit au format Conventional Commits en français (`feat:`, `fix:`, `docs:`, `chore:`, `test:`). Ne jamais commiter de fichier `.env`, de secret ni de fichier audio de test.
5. **Synchronisation distante** : `git push -u origin <branche>`. Si le push échoue, s'arrêter immédiatement et expliquer pourquoi.
6. **Compte-rendu final** : Terminer systématiquement par un résumé court : ce qui a été fait, ce qui reste, et la prochaine commande à lancer.
