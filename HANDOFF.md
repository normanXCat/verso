# Verso — Journal de Passation (HANDOFF)

## État actuel

- **Phase en cours** : Refonte Design "Encre & Papier" — Étape 2 (Landing page `/`) terminée et Étape 3 (Pages d'authentification) commitée.
- **Phase d'implémentation Spec Kit** : **Phase 3 (Google et ORCID, T019 à T022) terminée**.
- **Ce qui est terminé** :
  - Ratification de la constitution du projet ([.specify/memory/constitution.md](file:///home/normanxcat/Lab/verso/.specify/memory/constitution.md) en version `1.1.0`) avec ses 7 principes non négociables.
  - Spécification fonctionnelle complète de la plateforme Verso ([specs/001-verso-core/spec.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/spec.md)) avec checklist validée à 100% (16/16).
  - Clarification interactive (`/speckit-clarify`) sur les 5 points critiques.
  - Planification d'implémentation technique complète (`/speckit-plan`) et analyse de cohérence (`/speckit-analyze`).
  - Découpage complet des tâches d'implémentation ([specs/001-verso-core/tasks.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/tasks.md)) en 13 phases testables isolément (62 tâches).
  - **Phase 1 (Base du projet, Docker, CI, schéma Prisma) 100% implémentée et testée (T001 à T009)**.
  - **Phase 2 (Authentification email et sessions) 100% implémentée et testée (T010 à T018)**.
  - **Refonte Design "Encre & Papier" — Étape 1 (Design System)** : tokens clair/sombre, polices Fontsource, texture papier, composants de base et page `/design`.
  - **Refonte Design "Encre & Papier" — Étape 2 (Landing page `/`)** : navigation sticky, hero asymétrique, feuille signature animée, sections interactives, CTA et footer éditorial.
  - **Refonte Design "Encre & Papier" — Étape 3 (Pages d'authentification)** : mise en page éditoriale en deux colonnes, saisies animées, états de chargement/erreur (`AuthLayout`, `LoginPage`, `RegisterPage`, `ForgotPasswordPage`).
  - **Phase 3 (Google et ORCID, T019 à T022) implémentée et testée** :
    - Service OAuth avec `arctic` (state + PKCE S256 pour Google et ORCID) dans `apps/api/src/modules/auth/oauth.service.ts`.
    - Jetons temporaires de liaison de compte signés en HMAC (aucun stockage en base, expiration 10 minutes).
    - Routes `/api/auth/oauth/:provider`, `/api/auth/oauth/:provider/callback` et `/api/auth/oauth/link-confirm` dans `apps/api/src/modules/auth/oauth.routes.ts`.
    - Flux exposés : connexion d'un compte OAuth déjà associé, création de compte au premier passage, et liaison sécurisée par confirmation du mot de passe si l'adresse email existe déjà.
    - Composants frontend `OAuthButtons.tsx` (Google & ORCID) et `LinkAccountModal.tsx` (confirmation par mot de passe).
    - Tests d'intégration dans `apps/api/tests/integration/oauth.test.ts` (9 tests).
    - **Suite de tests : 39 tests au vert** (7 fichiers) ; lint, format, typecheck et build de production validés.
  - Branche `dev` active.
- **Ce qui est en cours** :
  - Phase 3 terminée : arrêt pour validation avant la **Phase 4 (Espace personnel, recherche, filtres — T023 à T026)**.
- **Ce qui reste à faire** :
  - **Phase 4** : Espace personnel, recherche plein texte et filtres (T023 à T026).
  - **Phase 5** : Textes, brouillons, sauvegarde auto, favoris, tags (T027 à T033).
  - **Refonte Design Étape 4** : Espace personnel (barre latérale, cartes de textes et d'albums, squelettes).

## Dernière action

- **Action exécutée** : Implémentation de la Phase 3 (Connexion avec Google et ORCID, T019 à T022) en respectant la constitution, la spec, le plan et la liste des tâches.
- **Résultat** : Service et routes OAuth opérationnels avec `state` + PKCE, liaison de compte confirmée par mot de passe, composants frontend intégrés, tests d'intégration verts sur la branche `dev`.

## Décisions prises

- **Structure Monorepo (`apps/web`, `apps/api`, `packages/shared`)** : mutualise les schémas Zod, les types et le moteur poétique.
- **Backend Fastify + Prisma + PostgreSQL** : performance et écosystème de plugins sécurisés.
- **Éditeur CodeMirror 6** : décorations asynchrones adaptées aux gouttières de syllabes et au surlignage de rimes.
- **Stockage S3 découplé avec URLs présignées** : MinIO en local, Cloudflare R2 en production.
- **Persistance locale IndexedDB + Service Worker** : écriture sans perte même hors ligne.
- **Direction artistique "Encre & Papier"** : univers éditorial haut de gamme, accent vermillon unique, typographies Instrument Serif & Geist, aucun dégradé néon.
- **Découpage en 13 phases strictement isolées** : progression incrémentale vérifiable.
- **OAuth avec `arctic`** : `state` cryptographique + PKCE S256, jetons de liaison signés en HMAC (pas de table dédiée). **`arctic` est déprécié (juillet 2026)** : la bibliothèque reste publiée (v3.7.0) et fonctionnelle ; à remplacer par une implémentation native si elle disparaît du registre.
- **Pas de provider ORCID intégré à `arctic`** : ORCID est implémenté via le `OAuth2Client` générique (endpoints `orcid.org/oauth/authorize`, `/token`, `/userinfo`).
- **Callback OAuth en redirection navigateur** : contrairement au contrat initial (renvoi d'un `409 JSON`), le callback redirige vers `CLIENT_URL` avec des paramètres (`?oauth=success`, `?oauth=link_required&linkToken=...`, `?oauth=error`). Un utilisateur navigue en haut niveau et ne peut pas consommer une réponse JSON de callback.
- **Tests d'intégration exécutés séquentiellement** : la base PostgreSQL de test étant partagée, `fileParallelism: false` (configs Vitest racine et `apps/api`) évite les interférences de `deleteMany` entre fichiers.

## Branche et dernier commit

- **Branche active** : `dev`
- **Dernier commit** : `04a0a6f` — `feat: composants frontend oauth et modale de liaison de compte`

## Comment lancer le projet

```bash
# Vérifier la branche active (dev ou feature)
git branch --show-current

# Installer les dépendances du monorepo
pnpm install

# Lancer la base PostgreSQL et MinIO en local
docker compose up -d

# Appliquer les migrations Prisma
pnpm --filter @verso/api exec prisma migrate dev

# Lancera les serveurs de développement (API + Web)
pnpm dev

# Tests, typage et qualité (le standard est zéro warning)
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
```

## Variables d'environnement

Seuls les noms des variables prévues par l'architecture sont documentés (aucune valeur ni secret) :

- `DATABASE_URL` : URL de connexion PostgreSQL pour Prisma ORM.
- `SESSION_SECRET` : Clé secrète de signature des cookies de session et des jetons de liaison OAuth.
- `PORT` : Port d'écoute du serveur backend Fastify.
- `HOST` : Interface d'écoute du serveur backend.
- `NODE_ENV` : Mode d'exécution (`development`, `test`, `production`).
- `CLIENT_URL` : Origine autorisée pour la politique CORS et les redirections client.
- `API_URL` : URL publique du serveur API (construction des URI de redirection OAuth).
- `S3_ENDPOINT` : Point de terminaison du stockage compatible S3.
- `S3_REGION` : Région du bucket S3.
- `S3_BUCKET_NAME` : Nom du compartiment de stockage audio.
- `S3_ACCESS_KEY_ID` : Identifiant de la clé d'accès S3.
- `S3_SECRET_ACCESS_KEY` : Clé secrète d'accès S3.
- `GOOGLE_CLIENT_ID` : Identifiant client OAuth Google.
- `GOOGLE_CLIENT_SECRET` : Secret client OAuth Google.
- `ORCID_CLIENT_ID` : Identifiant client OAuth ORCID.
- `ORCID_CLIENT_SECRET` : Secret client OAuth ORCID.
- `RESEND_API_KEY` : Clé API des emails transactionnels (Resend).
- `EMAIL_FROM` : Expéditeur des emails transactionnels.

## Problèmes connus et points d'attention

- **`arctic` est déprécié** (juillet 2026, v3.7.0 encore publiée) : dépendance fonctionnelle mais à surveiller/remplacer à terme.
- **OAuth non testé contre les vrais fournisseurs** : les tests d'intégration stubent `fetch`. La configuration réelle de Google et ORCID (identifiants, URI de redirection `API_URL/api/auth/oauth/:provider/callback`) reste à valider en environnement de recette.
- **ORCID et adresse email** : le point de terminaison userinfo d'ORCID peut ne pas renvoyer d'email. Dans ce cas, la création/liaison de compte est refusée proprement (redirection `?oauth=error&reason=email_required`).
- **ORCID et authentification client** : `arctic` envoie les identifiants via Basic Auth sur le point de terminaison de jeton. À vérifier avec de vrais identifiants ORCID.
- **Liaison multi-OAuth sans mot de passe** : si un compte a été créé uniquement via un fournisseur OAuth (sans mot de passe) et qu'un second fournisseur arrive avec le même email, la liaison est refusée (aucun mot de passe à confirmer).
- **Base de test partagée** : les tests d'intégration de l'API partagent une base PostgreSQL unique et s'exécutent séquentiellement.
- Toujours vérifier que la branche active est `dev` ou une branche de fonctionnalité avant toute modification.
- Ne jamais commiter de fichier `.env`, de secret ni de fichier audio de test.
- Respecter scrupuleusement le protocole de fin de tâche dans l'ordre strict des 6 étapes.

## Prochaine étape

- **Commande recommandée** : `/speckit-implement` pour la Phase 4 (Espace personnel, recherche et filtres, T023 à T026).
- **Prompt recommandé** :
  ```text
  Implémente la phase 4 (espace personnel, recherche plein texte et filtres, T023 à T026).
  Travaille tâche par tâche, commit par tâche terminée avec un message Conventional
  Commits en français, lance lint et tests, puis pousse sur dev et résume pour validation.
  ```
