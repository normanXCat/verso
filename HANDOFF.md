# Verso — Journal de Passation (HANDOFF)

## État actuel

- **Phase en cours** : Refonte Design "Encre & Papier" — Étape 2 (Landing page `/`) terminée.
- **Ce qui est terminé** :
  - Ratification de la constitution du projet ([.specify/memory/constitution.md](file:///home/normanxcat/Lab/verso/.specify/memory/constitution.md) en version `1.1.0`) avec ses 7 principes non négociables.
  - Spécification fonctionnelle complète de la plateforme Verso ([specs/001-verso-core/spec.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/spec.md)) avec checklist validée à 100% (16/16).
  - Clarification interactive (`/speckit-clarify`) sur les 5 points critiques (bannière email non bloquante, liaison OAuth sécurisée par mot de passe, quotas audio 75 Mo / 3 pistes, gestion des conflits hors ligne par duplication, rétention permanente des versions).
  - Planification d'implémentation technique complète (`/speckit-plan`) et analyse de cohérence (`/speckit-analyze`).
  - Découpage complet des tâches d'implémentation ([specs/001-verso-core/tasks.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/tasks.md)) en 13 phases testables isolément (62 tâches).
  - **Phase 1 (Base du projet, Docker, CI, schéma Prisma) 100% implémentée et testée (T001 à T009)**.
  - **Phase 2 (Authentification email et sessions) 100% implémentée et testée (T010 à T018)**.
  - **Refonte Design "Encre & Papier" — Étape 1 (Design System) 100% implémentée et validée** :
    - Tokens complets clair & sombre (`--color-bg`, `--color-surface`, `--color-text`, `--color-border`, `--color-accent`, marge rouge cahier, réglures) dans `index.css` et `tailwind.config.js`.
    - Polices auto-hébergées avec Fontsource : `Instrument Serif` (titres), `Geist Sans` (interface), `Geist Mono` (BPM, métrique).
    - Texture papier SVG sans dépendance réseau et réglures de cahier.
    - Composants de base : `Button`, `Input`, `Card`, `Tag`, `Modal`, `Toast`, `ThemeSwitch`, et page de démonstration `/design`.
  - **Refonte Design "Encre & Papier" — Étape 2 (Landing page `/`) 100% implémentée et testée** :
    - Navigation fine et sticky avec réduction fluide au scroll (`Navbar.tsx`).
    - Hero asymétrique avec grand titre Instrument Serif et feuille signature de rap animée (`RapSheetSignature.tsx`) avec numéros de ligne, décompte syllabique mono et révélation progressive des rimes en vermillon.
    - Section "Écrire" (`EditorSection.tsx`) avec mockup d'éditeur interactif où l'on peut taper en direct, compteur syllabique poétique français en temps réel et sauvegarde automatique visible.
    - Section "Organiser" (`OrganizeSection.tsx`) avec pile d'albums déployable au survol et réorganisation interactive de tracklist animée.
    - Section "Instrus" (`InstrumentalsSection.tsx`) avec lecteur audio stylisé, forme d'onde animée synchronisée au tempo, BPM et tonalité en Geist Mono.
    - Section "Protéger" (`ProtectSection.tsx`) avec frise chronologique verticale d'antériorité certifiée et hachages SHA-256.
    - Section "Comment ça marche" (`HowItWorksSection.tsx`) avec 3 grandes étapes en chiffres Instrument Serif.
    - CTA final pleine largeur sur fond encre profond (`FinalCtaSection.tsx`) et footer éditorial sobre (`Footer.tsx`).
  - Branche `dev` active et synchronisée.
- **Ce qui est en cours** :
  - Étape 2 terminée avec succès (lint, tests 30/30, build de production validés), arrêt pour validation avant Étape 3 (Pages d'authentification).
- **Ce qui reste à faire** :
  - **Étape 3** : Refonte Pages d'authentification (2 colonnes, inputs animés, panneau éditorial).
  - **Étape 4** : Refonte Espace personnel (barre latérale, cartes de textes et d'albums, squelettes).
  - Reprise de la **Phase 3 : Google et ORCID (T019 à T022)**.

## Dernière action

- **Action exécutée** : Implémentation complète de l'Étape 2 de la refonte design "Encre & Papier" (Landing page `/`, feuille signature animée, sections interactives).
- **Résultat** : Landing page éditoriale complète, builds et tests au vert, disponible sur `/`.










## Décisions prises

- **Structure Monorepo (`apps/web`, `apps/api`, `packages/shared`)** : Permet de partager les schémas Zod, les types et le moteur poétique sans duplication de code.
- **Backend Fastify + Prisma + PostgreSQL** : Performance brute supérieure, écosystème de plugins sécurisé (`@fastify/cookie`, `@fastify/rate-limit`, `@fastify/csrf-protection`).
- **Éditeur CodeMirror 6** : Architecture basée sur des décorations d'état asynchrones idéales pour les gouttières de syllabes et le surlignage de rimes sans bloquer la saisie.
- **Stockage S3 découplé avec URLs présignées** : MinIO en local, Cloudflare R2 en production, téléversement direct sans transiter par la mémoire du serveur applicatif.
- **Persistance locale IndexedDB + Service Worker** : Garantit une écriture continue sans risque de perte même en mode hors ligne.
- **Direction artistique "Encre & Papier"** : Univers éditorial haut de gamme inspiré d'un cahier de rappeur (surfaces papier chaleureuses, accent vermillon unique, typographie Instrument Serif & Geist, aucun dégradé violet/bleu ni effet néon).
- **Découpage en 13 phases strictement isolées** : Chaque phase dispose de son propre critère de test indépendant pour une progression incrémentale vérifiable.

## Branche et dernier commit

- **Branche active** : `dev`
- **Dernier commit** : `6596dbe` — `feat: bannière persistante de rappel de vérification d email`



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
