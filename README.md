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
| **Socle** | **Constitution & Gouvernance v2.0.0** | ✅ Fait | 7 principes non négociables, amendés pour intégrer la collaboration sécurisée (fonction centrale `can`, rôles, anti-fuite 404, historique multi-auteurs, invitations hachées, modération/blocage, rate limiting et protection XSS) |
| **Socle** | **Discipline Git & Protection des données** | ✅ Fait | Branche `dev`, blocage des `.env`, secrets et audio via `.gitignore` |
| **Socle** | **Documentation & Handoff permanent** | ✅ Fait | `HANDOFF.md` et `README.md` mis à jour avant chaque commit |
| **Socle** | **Outillage Spec Kit** | ✅ Fait | Workflows et scripts de spécification, planification et tâches |
| **Socle** | **Spécification Fonctionnelle Verso Core** | ✅ Fait | Spécification complète et clarifiée ([specs/001-verso-core/spec.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/spec.md)) |
| **Socle** | **Planification Technique Verso Core** | ✅ Fait | Architecture monorepo, schéma Prisma, contrats d'API et quickstart ([specs/001-verso-core/plan.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/plan.md)) |
| **Socle** | **Découpage des Tâches d'Implémentation** | ✅ Fait | 62 tâches en 13 phases ordonnancées, testables et priorisées ([specs/001-verso-core/tasks.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/tasks.md)) |
| **P3** | **Spécification Fonctionnelle Collaboration Auteurs** | ✅ Fait | Spécification complète et clarifiée (5 arbitrages clés), priorisée (P1, P2, P3) avec checklist validée à 100% ([specs/002-author-collaboration/spec.md](file:///home/normanxcat/Lab/verso/specs/002-author-collaboration/spec.md)) |
| **P3** | **Planification Technique Collaboration Auteurs** | ✅ Fait | Architecture centrale `can()`, modèle relationnel Prisma étendu, contrats REST/SSE/WS, verrouillage optimiste P1 et quickstart ([specs/002-author-collaboration/plan.md](file:///home/normanxcat/Lab/verso/specs/002-author-collaboration/plan.md)) |
| **P3** | **Découpage des Tâches Collaboration Auteurs** | ✅ Fait | 79 tâches ordonnancées en 11 phases testables isolément ([specs/002-author-collaboration/tasks.md](file:///home/normanxcat/Lab/verso/specs/002-author-collaboration/tasks.md)), traçabilité par récit (US1 à US8) et priorités P1/P2/P3 |
| **Socle** | **Monorepo & Outillage Qualité (Phase 1)** | ✅ Fait | Monorepo pnpm (`apps/api`, `apps/web`, `packages/shared`), TS strict, ESLint/Prettier zéro warning |

| **Socle** | **Docker & Base PostgreSQL (Phase 1)** | ✅ Fait | Docker Compose (PostgreSQL 16, MinIO S3), schéma Prisma et migration initiale appliquée (13 tables) |
| **Socle** | **CI GitHub Actions (Phase 1)** | ✅ Fait | Pipeline CI automatisé (`.github/workflows/ci.yml`) testant lint, format, typecheck et tests |
| **Socle** | **Design System « Encre & Papier »** | ✅ Fait | Tokens clair/sombre, typographie Fontsource (Instrument Serif, Geist), Framer Motion, page `/design`, composant `Button` unifié (icônes, chargement, pleine largeur, `asChild`), `NavLink` (trait au survol en 150 ms, état actif) et logotype `Logo` vectoriel |
| **Socle** | **Landing Page « Encre & Papier »** | ✅ Fait | Hero asymétrique, feuille signature animée, mockup interactif, studio audio, frise d'antériorité |
| **P1** | **Authentification sécurisée & Sessions** | ✅ Fait | Mots de passe Argon2id, sessions PostgreSQL en cookies HttpOnly/Secure/SameSite=Lax, emails transactionnels, rate limiting |
| **P1** | **Espace personnel, recherche & filtres** | ✅ Fait | Tableau de bord `/app`, recherche plein texte en direct (titre et paroles), filtres brouillons/terminés/favoris, cloisonnement par utilisateur |
| **P1** | **Éditeur, sauvegarde auto, favoris & tags** | ✅ Fait | Éditeur CodeMirror 6, sauvegarde automatique (< 500 ms, brouillon local), compteurs mots/lignes en direct, statut brouillon/terminé, favoris et tags personnalisés |
| **P1** | **Albums & réorganisation de tracklist** | ✅ Fait | Création d'albums, rattachement de textes existants, tracklist réordonnable par glisser-déposer (`@dnd-kit`) et détachement automatique à la suppression (aucun texte jamais supprimé) |
| **P2** | **Historique des versions** | ✅ Fait | Archivage horodaté immuable à chaque modification (conservé indéfiniment, sans purge ni plafond), aperçu comparatif et restauration d'une révision antérieure sans écrasement de l'historique |

| **P3** | **Application installable (PWA) & Mode Hors Ligne** | ✅ Fait | Service Worker Workbox + manifeste installable, rédaction hors ligne (IndexedDB), file d'attente d'actions et synchronisation au retour du réseau avec duplication de conflit `[Titre] (copie hors ligne)` |
| **P3** | **Enregistrement vocal freestyle** | ✅ Fait | Capture micro via `MediaRecorder`, téléversement direct vers un stockage compatible S3 par URL présignée, mémos vocaux rattachés au texte avec lecture et suppression |
| **P3** | **Suggestions de rimes (dictionnaire français)** | ✅ Fait | Base lexicale française embarquée (`lyrics-engine/rhyme-dict`), classement rimes riches / suffisantes et tiroir latéral de suggestions avec insertion en un clic depuis la sélection de l'éditeur |
| **P2** | **Instrumentales audio, lecteur, BPM, boucle & métronome** | ✅ Fait | Téléversement direct vers un stockage compatible S3 par URLs présignées (MP3/WAV, ≤ 75 Mo, 3 pistes max), clé seule en base, lecteur Web Audio avec boucle de section et métronome synchronisé |
| **P2** | **Compteur de syllabes & détection des rimes** | ✅ Fait | Moteur `lyrics-engine` partagé (syllabes poétiques en modes classique/relâché, rimes phonétiques), gouttière CodeMirror du décompte par vers et surlignage coloré des rimes |
| **P2** | **Mode concentration (zen)** | ✅ Fait | Plein écran masquant les éléments d'interface parasites pour isoler l'auteur avec son texte |
| **P2** | **Export PDF horodaté (antériorité)** | ✅ Fait | Certificat PDF sobre généré côté serveur (`pdfkit`) : titre, paroles, auteur et horodatage exact de la dernière révision |
| **P2** | **Liens de partage privés révocables** | ✅ Fait | Partage explicite en lecture seule, jetons hachés révocables avec expiration optionnelle, page publique anonyme et rate limiting strict |
| **P3** | **OAuth (Google & ORCID)** | ✅ Fait | Flux OAuth avec `state` et PKCE (arctic), création/connexion de compte, et liaison sécurisée par confirmation du mot de passe |
| **Socle** | **Finitions design, validation & audit de sécurité (Phase 13)** | ✅ Fait | Bascule de thème segmentée `ThemeToggle` accessible (Papier/Encre), en-têtes Helmet, CORS restrictif et protection CSRF par validation d'origine vérifiés et testés |
| **Collab** | **Invitations & Rôles co-auteurs (US1)** | ✅ Fait | Contrôle d'accès centralisé `can()`, invitations par jeton haché SHA-256 avec expiration à 7 jours, gestion des rôles (co-auteur, commentateur, lecteur) et démission volontaire |
| **Collab** | **Espace « Partagés avec moi » (US2)** | ✅ Fait | Section dédiée dans le carnet pour consulter et filtrer les œuvres partagées par rôle et par auteur avec badges de rôle discrets |
| **Collab** | **Commentaires ancrés & Réponses (US3)** | ✅ Fait | Fils de discussion ancrés sur les vers, réponses chronologiques, autocomplétion des mentions `@pseudonyme`, cycle de résolution et notifications SSE |
| **Collab** | **Historique multi-auteurs & Conflits (US4)** | ✅ Fait | Attribution nominative des révisions, verrouillage optimiste avec gestion de conflits non destructifs (`409 Conflict`), archivage automatique des versions divergentes et modal de comparaison diff côte à côte |
| **Collab** | **Notifications in-app & Emails (US5)** | ✅ Fait | Flux d'événements SSE temps réel, tiroir de notifications avec comptage non lu, préférences utilisateur granulaires et emails transactionnels asynchrones |
| **Collab** | **Crédits artistiques & Antériorité (US6)** | ✅ Fait | Déclaration des rôles créatifs (auteur, featuring, beatmaker, producteur) et quotes-parts calculées sans blocage, certifiées dans l'export PDF |
| **Collab** | **Profil minimal & Modération (US7)** | ✅ Fait | Profils publics sans fuite d'email, recherche anti-énumération, blocage mutuel avec rupture bilatérale immédiate, signalement d'abus et fil d'activité récente |
| **Collab** | **Écriture temps réel & Studio session (US8)** | ✅ Fait | Synchronisation collaborative synchrone Yjs sur CodeMirror 6, curseurs distants colorés, présence en direct et sessions studio synchronisant le transport Web Audio et le métronome |
| **Collab** | **Audit sécurité IDOR & Quickstart (Phase 11)** | ✅ Fait | Étanchéité multi-tenant validée sur 100% des endpoints (404 neutre), couverture des 5 scénarios de bout en bout de `quickstart.md`, 278 tests au vert |
| **Socle** | **Série photographique & Visuels « Encre & Papier »** | ✅ Fait | Direction artistique argentique noir et blanc, formats légers AVIF/WebP/JPEG (< 120 Ko), respect WCAG AA, contrôle strict au build (`scripts/check-images.mjs`), registre complet ([docs/IMAGES.md](docs/IMAGES.md)) et charte ([docs/IMAGE-STYLE.md](docs/IMAGE-STYLE.md)) |

*(Règle : une fonctionnalité n'est marquée ✅ que si elle est effectivement implémentée et testée dans le code).*

---

## Stack technique

L'architecture technique conçue lors du plan d'implémentation repose sur :

- **Architecture** : Monorepo TypeScript (`apps/web`, `apps/api`, `packages/shared`)
- **Frontend & Direction Artistique** : React 18+, TypeScript, Vite, Tailwind CSS, Framer Motion, typographies auto-hébergées via Fontsource (`Instrument Serif`, `Geist Sans`, `Geist Mono`), React Router, TanStack Query, CodeMirror 6, dnd-kit

- **PWA & Offline** : `vite-plugin-pwa`, Service Workers, IndexedDB (`idb`)
- **Backend** : Node.js (LTS), TypeScript, Fastify v4+ (API REST haute performance), génération PDF avec `pdfkit`
- **Base de données & ORM** : PostgreSQL 16, Prisma ORM v5+ avec migrations versionnées
- **Stockage Audio** : Compatible S3 (MinIO en développement local, Cloudflare R2 en production) via URLs présignées (`@aws-sdk/client-s3` et `@aws-sdk/s3-request-presigner`), téléversement direct du binaire hors API
- **Sécurité** : Hachage Argon2id, sessions PostgreSQL avec cookies HttpOnly/Secure/SameSite=Lax, protection CSRF par validation d'origine (`Origin`/`Referer`), en-têtes Helmet (HSTS, CSP en production), CORS restrictif, Arctic (OAuth Google/ORCID avec PKCE), `@fastify/rate-limit`
- **Métrique & Rimes** : Module partagé `lyrics-engine` adapté aux spécificités de la langue française (comptage syllabique par vers, détection et coloration des rimes), exposé via des extensions CodeMirror 6
- **Qualité & Tests** : Vitest (tests unitaires et d'intégration, exécution séquentielle), React Testing Library + `jsdom` (tests de composants, à partir de `Button`), ESLint et Prettier (zéro warning toléré)

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

# Builds de production : compiler le package partagé avant chaque application
pnpm --filter @verso/shared build
pnpm --filter @verso/api build
pnpm --filter @verso/web build

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
│   │   ├── src/                # Serveur HTTP, validation Zod env, plugins (S3) et modules (auth, OAuth, songs, albums, audio, partage)
│   │   └── vitest.config.ts    # Configuration Vitest du package API
│   └── web/                    # Frontend React 18 + Vite + Tailwind CSS
│       ├── public/             # Assets statiques et manifeste PWA (manifest.json)
│       └── src/                # App React, pages (landing, auth, dashboard, éditeur, album), composants (dont audio), hooks et styles
├── packages/
│   └── shared/                 # Bibliothèque partagée (@verso/shared)
│       └── src/                # Schémas Zod, types et moteur poétique
├── specs/                      # Spécifications fonctionnelles et techniques
│   ├── 001-verso-core/         # Spécification complète et plan de la plateforme Verso
│   │   ├── checklists/         # Checklist de qualité (16/16)
│   │   ├── contracts/          # Contrats d'API REST Zod
│   │   ├── data-model.md       # Modèle relationnel détaillé Prisma / PostgreSQL
│   │   ├── plan.md             # Plan d'implémentation technique global
│   │   ├── quickstart.md       # Scénarios de validation exécutables
│   │   ├── research.md         # Décisions d'architecture
│   │   ├── spec.md             # Spécification fonctionnelle validée
│   │   └── tasks.md            # Découpage des 62 tâches ordonnancées
│   └── 002-author-collaboration/ # Spécification et planification de la collaboration entre auteurs
│       ├── checklists/         # Checklist de qualité (16/16)
│       ├── contracts/          # Contrats d'API REST Zod, SSE et WebSocket
│       ├── data-model.md       # Modèle relationnel Prisma étendu (Collaborator, Comment, etc.)
│       ├── plan.md             # Plan d'implémentation technique global
│       ├── quickstart.md       # Scénarios de validation exécutables
│       ├── research.md         # Décisions d'architecture (can, conflits P1, Yjs P3)
│       ├── spec.md             # Spécification fonctionnelle clarifiée
│       └── tasks.md            # Découpage des 79 tâches ordonnancées
├── docs/
│   └── brand/
│       └── logo-wordmark.svg   # Logotype Verso (Instrument Serif converti en tracés)
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
├── tsconfig.base.json          # Configuration TypeScript stricte commune
└── vitest.config.ts            # Configuration Vitest (exécution séquentielle des tests)
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
| `API_URL` | URL publique du serveur API, utilisée pour construire les URI de redirection OAuth |
| `S3_ENDPOINT` | Point de terminaison du service de stockage d'objets compatible S3 |
| `S3_REGION` | Région géographique du stockage S3 |
| `S3_BUCKET_NAME` | Nom du compartiment de stockage pour les fichiers audio |
| `S3_ACCESS_KEY_ID` | Identifiant d'accès au stockage compatible S3 |
| `S3_SECRET_ACCESS_KEY` | Clé secrète d'accès au stockage compatible S3 |
| `GOOGLE_CLIENT_ID` | Identifiant client de l'application OAuth Google |
| `GOOGLE_CLIENT_SECRET` | Secret client de l'application OAuth Google |
| `ORCID_CLIENT_ID` | Identifiant client de l'application OAuth ORCID |
| `ORCID_CLIENT_SECRET` | Secret client de l'application OAuth ORCID |
| `RESEND_API_KEY` | Clé API du transport d'emails transactionnels (Resend) — **obligatoire en production** |
| `EMAIL_FROM` | Expéditeur des emails transactionnels (défaut `Verso <noreply@verso.fr>`) |

---

## Dépannage

### Erreur 500 sur toutes les requêtes de l'API

Un 500 global signifie presque toujours que la base de données est injoignable ou que la configuration est incomplète. L'API répond désormais un message générique accompagné d'un identifiant de requête (`requestId`) et journalise l'erreur détaillée côté serveur (jamais la pile ni de secret).

1. **Vérifier l'état de l'API et de la base** :
   ```bash
   curl http://localhost:4000/health
   ```
   - `{"status":"ok","database":"up"}` → la base répond.
   - `{"status":"error","database":"down"}` (HTTP 503) → PostgreSQL est arrêté ou `DATABASE_URL` est incorrecte.
2. **Vérifier les variables d'environnement** : à la racine du projet, `cp .env.example .env`. `DATABASE_URL` et `SESSION_SECRET` sont obligatoires ; l'API refuse de démarrer et nomme explicitement la variable manquante. Le `.env` de la racine est chargé quel que soit le répertoire de lancement.
3. **Démarrer la base** : `docker compose up -d` (PostgreSQL 16 + MinIO).
4. **Appliquer les migrations** : `pnpm --filter @verso/api exec prisma migrate dev`.
5. **Régénérer le client Prisma** si nécessaire : `pnpm --filter @verso/api exec prisma generate`.
6. **Emails en développement (sans Docker ni SMTP)** : sans `RESEND_API_KEY` et hors production, l'API affiche dans la console l'email complet — destinataire, objet, contenu et **lien de vérification** — encadré par un bandeau `EMAIL SIMULÉ`, et l'inscription n'échoue jamais (le compte est créé, l'envoi peut être redemandé). En **production**, l'absence de transport d'email empêche le démarrage de l'API (message nommant `RESEND_API_KEY`) : aucun lien de vérification n'est jamais journalisé en production.
7. **Proxy Vite, CORS et CSRF** : le frontend appelle `/api/*`, redirigé vers l'API par le proxy de développement Vite. `CLIENT_URL` doit correspondre à l'origine du frontend (défaut `http://localhost:5173`) pour le CORS et la protection CSRF.

### Renvoi d'email de vérification et requêtes sans corps

- **Gestion des corps vides** : le client HTTP frontend centralisé ([`apps/web/src/lib/http-client.ts`](file:///home/normanxcat/Lab/verso/apps/web/src/lib/http-client.ts)) n'ajoute `Content-Type: application/json` que si la requête contient un corps non vide. Côté serveur, les routes sans corps (déconnexion, renvoi d'email, acceptation d'invitations, etc.) sont configurées avec `allowEmptyBody: true` via le plugin Fastify dédié, évitant le rejet `FST_ERR_CTP_EMPTY_JSON_BODY` sans affaiblir la validation des autres routes.
- **Rate limiting du renvoi** : limité à 1 renvoi par minute (calcul dynamique du temps restant renvoyant un statut 429 avec `Retry-After: <secondes>` et le message `"Réessaie dans X secondes"`) et à 5 renvois par heure.
- **Configuration de production (Render / Vercel)** :
  - `RESEND_API_KEY` : clé API Resend valide.
  - `EMAIL_FROM` : adresse d'expédition avec un domaine vérifié sur Resend (ex. `Verso <noreply@mondomaine.fr>`). Par défaut en sandbox sans domaine personnalisé : `onboarding@resend.dev` (limité à l'adresse du propriétaire de compte).
  - `CLIENT_URL` : URL de production du frontend (ex. `https://verso.vercel.app`). En production, l'API journalise un avertissement critique si cette variable contient `localhost`, car le lien de vérification envoyé à l'utilisateur pointerait vers sa propre machine.
- **En cas d'échec du fournisseur d'email** : l'API intercepte les erreurs réseau ou d'API Resend, consigne les détails dans les journaux de Render de manière sécurisée (secrets et clés masqués), et renvoie un statut HTTP 502 Bad Gateway propre avec le message `"Impossible d'envoyer l'email pour le moment. Réessaie dans quelques minutes."`. Le bandeau affiche ce libellé sans altérer l'interface.

---

## Règles de fin de tâche obligatoires

Chaque tâche exécutée DOIT impérativement respecter ce protocole dans l'ordre strict :

1. **Lint et tests** : Lancer le linter et la suite de tests (`npm run lint`, `npm test`, etc.) ; corriger toutes les erreurs avant de continuer.
2. **Documentation obligatoire** : Mettre à jour [HANDOFF.md](file:///home/normanxcat/Lab/verso/HANDOFF.md) (état actuel, dernière action, décisions, branche et dernier commit, comment lancer, variables d'environnement par nom seulement, problèmes connus, prochaine étape) et [README.md](file:///home/normanxcat/Lab/verso/README.md) (fonctionnalités avec statut, stack, installation, lancement, structure). Ne documenter que ce qui existe réellement dans le code.
3. **Discipline de branches** : Ne jamais travailler directement sur `main`. Utiliser la branche courante si ce n'est pas `main`, sinon créer et basculer sur `dev`.
4. **Staging & Commit** : `git add`, puis commit au format Conventional Commits en français (`feat:`, `fix:`, `docs:`, `chore:`, `test:`). Ne jamais commiter de fichier `.env`, de secret ni de fichier audio de test.
5. **Synchronisation distante** : `git push -u origin <branche>`. Si le push échoue, s'arrêter immédiatement et expliquer pourquoi.
6. **Compte-rendu final** : Terminer systématiquement par un résumé court : ce qui a été fait, ce qui reste, et la prochaine commande à lancer.
