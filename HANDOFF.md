# Verso — Journal de Passation (HANDOFF)

## État actuel

- **Phase en cours** : Refonte Design "Encre & Papier" — Étape 2 (Landing page `/`) terminée et Étape 3 (Pages d'authentification) commitée.
- **Phase d'implémentation Spec Kit** : **Phase 9 (Aides à l'écriture : syllabes, rimes, mode concentration — T047 à T050) terminée** (troisième phase P2).
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
    - Suite de tests de la Phase 3 : 9 tests d'intégration OAuth.
  - **Phase 4 (Espace personnel, recherche, filtres — T023 à T026) implémentée et testée** :
    - Schémas Zod de recherche et filtres dans `packages/shared/src/schemas/search.ts`.
    - Moteur Prisma de recherche plein texte (titre et paroles) et de filtres combinables dans `apps/api/src/modules/songs/songs.repository.ts`.
    - Endpoint `GET /api/songs` cloisonné par utilisateur et garde d'authentification réutilisable `requireAuth` (`auth.guard.ts`).
    - Espace personnel `/app` protégé : recherche en direct (debounce 200 ms), filtres, cartes de textes et états de chargement/vide (`DashboardPage.tsx`, `FilterBar.tsx`, `SongCard.tsx`).
    - Suite de tests de la Phase 4 : 9 tests d'intégration recherche/filtres.
  - **Phase 5 (Textes, brouillons, sauvegarde auto, favoris, tags — T027 à T033) implémentée et testée** :
    - Schémas Zod de création/mise à jour des textes et des tags (`packages/shared/src/schemas/song.ts`, `tag.ts`).
    - CRUD complet des textes (`songs.service.ts`, routes `POST/GET/PATCH/DELETE /api/songs`) cloisonné par utilisateur, avec gestion des tags et des favoris.
    - Éditeur CodeMirror 6 sobre (`LyricEditor.tsx`) et page d'édition `/app/songs/:id` (`EditorPage.tsx`).
    - Sauvegarde automatique continue (debounce 400 ms, brouillon local, reprise au retour du réseau) et indicateur de statut.
    - Compteurs en direct de mots et de lignes (`text-metrics.ts` partagé et testé, `EditorMetricsBar.tsx`).
    - Métadonnées : statut brouillon/terminé, favori et tags personnalisés (`SongMetadataSidebar.tsx`).
    - **Suite de tests totale : 65 tests au vert** (10 fichiers) ; lint, format, typecheck et build de production validés.
  - **Phase 6 (Albums et réorganisation de tracklist — T034 à T037) implémentée et testée** :
    - Schémas Zod des albums, de l'ajout de pistes et du réordonnancement (`packages/shared/src/schemas/album.ts`), avec les types `AlbumListItem`, `AlbumDetail` et `AlbumTrack`.
    - Repository, service et routes `/api/albums` (`GET`, `POST`, `GET/:id`, `PUT/:id`, `DELETE/:id`) cloisonnés par utilisateur (`albums.repository.ts`, `albums.service.ts`, `albums.routes.ts`).
    - Gestion de la tracklist : ajout d'un texte existant (`POST /:id/tracks`), retrait sans suppression (`DELETE /:id/tracks/:songId`) et réordonnancement par glisser-déposer (`PUT /:id/tracks/reorder`) avec réattribution de positions contiguës.
    - **Règle stricte FR-027** : la suppression d'un album détache tous ses textes (`albumId` et `positionInAlbum` remis à `null`) sans jamais en supprimer un seul.
    - Interface : page `/app/albums/:id` (`AlbumDetailPage.tsx`) avec métadonnées éditables, rattachement de textes existants et tracklist triable `@dnd-kit` (`SortableTracklist.tsx`, souris/tactile/clavier), carte d'album (`AlbumCard.tsx`) et création d'album depuis le tableau de bord.
    - **Suite de tests totale : 83 tests au vert** (11 fichiers) ; lint, format, typecheck et build de production validés.
  - **Phase 7 (Historique des versions — T038 à T041) implémentée et testée** :
    - Schémas Zod de l'historique (`packages/shared/src/schemas/version.ts`) : `versionIdParamSchema`, type `SongVersionItem`, et option `createVersion` sur la mise à jour d'un texte.
    - Archivage immuable automatique avant chaque modification du contenu ou du titre (ou après 5 minutes d'inactivité) dans `apps/api/src/modules/songs/versions.service.ts`.
    - Routes `GET /api/songs/:id/versions` (liste antichronologique) et `POST /api/songs/:id/versions/:versionId/restore` (restauration sans écrasement) dans `versions.routes.ts`, cloisonnées par utilisateur.
    - **Conservation intégrale FR-029** : aucune purge, aucun plafond sur le nombre de versions ; la restauration archive d'abord l'état courant (zéro perte).
    - Interface : tiroir latéral `VersionHistoryDrawer.tsx` (liste horodatée, aperçu complet, restauration) ouvert depuis l'éditeur, et méthodes `versions()`/`restoreVersion()` du client API.
    - **Suite de tests totale : 92 tests au vert** (12 fichiers) ; lint, format, typecheck et build de production validés.
  - **Phase 8 (Instrus S3, lecteur, BPM, boucle et métronome — T042 à T046) implémentée et testée** :
    - Schémas Zod des instrumentales (`packages/shared/src/schemas/audio.ts`) : formats MP3/WAV, limite de 75 Mo, quota de 3 pistes, BPM 20–300, types `InstrumentalItem` et `UploadUrlResult` (T043).
    - Plugin Fastify S3 (`apps/api/src/plugins/s3.plugin.ts`) basé sur `@aws-sdk/client-s3` et `@aws-sdk/s3-request-presigner` : URLs présignées PUT (5 min) et GET (1 h), suppression d'objet non bloquante, `forcePathStyle` pour MinIO (T042).
    - Repository, service et routes de gestion des instrumentales (`audio.repository.ts`, `audio.service.ts`, `audio.routes.ts`) : génération d'URL de téléversement cloisonnée (`users/{userId}/songs/{songId}/{uuid}.ext`), confirmation, liste avec URL de lecture signée, mise à jour des métadonnées, bascule de la piste active unique et suppression base + objet S3 (T045).
    - Enregistrement des routes sous `/api` : `POST/GET /api/songs/:id/instrumentals`, `POST /api/songs/:id/instrumentals/upload-url`, `POST .../confirm`, `PATCH/DELETE /api/instrumentals/:id`.
    - Client API audio et téléversement direct par `XMLHttpRequest` avec progression (`apps/web/src/lib/audio-client.ts`).
    - Hook `useAudioPlayer` (Web Audio API) : lecture via balise `<audio>`, boucle de section sample-précise (start/end), métronome synchronisé avec planification par anticipation sur l'horloge audio (T046).
    - Barre de lecture `AudioPlayerBar.tsx` intégrée à l'éditeur : sélection de piste active, transport, volume, boucle, BPM éditable et métronome (T046).
    - **Suite de tests totale : 107 tests au vert** (13 fichiers) ; lint, format, typecheck et build de production validés.
  - **Phase 9 (Aides à l'écriture : syllabes, rimes, mode concentration — T047 à T050) implémentée et testée** :
    - Moteur de comptage des syllabes poétiques françaises (`packages/shared/src/lyrics-engine/syllables.ts`) : groupes de voyelles, gestion du `e` caduc (modes `classic` et `relaxed`), élisions, particularités graphiques (`qu`, `gu`), décompte par ligne et total (T047).
    - Moteur de détection et de regroupement des rimes françaises (`packages/shared/src/lyrics-engine/rhymes.ts`) : clé phonétique de la terminaison (accents neutralisés, nasales et diphtongues normalisées, rimes en `[e]`), groupes de rimes et palette de couleurs `RHYME_PALETTE` (T048).
    - Tests unitaires partagés : `packages/shared/tests/syllables.test.ts` (9 tests) et `rhymes.test.ts` (7 tests).
    - Extensions CodeMirror 6 (`apps/web/src/components/editor/extensions/`) : gouttière du décompte syllabique par vers (`syllablesGutter.ts`) et surlignage coloré des terminaisons rimiques (`rhymeHighlighter.ts`), intégrées à `LyricEditor` via les options `showSyllables`/`showRhymes` (T049, FR-031, FR-032).
    - Mode concentration zen plein écran (`apps/web/src/components/editor/ZenModeToggle.tsx`) masquant l'en-tête, la barre latérale, les métriques et le lecteur audio ; synchronisé avec l'API Fullscreen (touche Échap) et intégré à l'éditeur (T050, FR-033).
    - **Suite de tests totale : 123 tests au vert** (15 fichiers) ; lint, format, typecheck et build de production validés.
  - Branche `dev` active.
- **Ce qui est en cours** :
  - Phase 9 terminée : arrêt pour validation avant la Phase 10.
- **Ce qui reste à faire** :
  - **Phase 10** : Export PDF d'antériorité et liens de partage privés révocables (T051 à T054).
  - **Refonte Design Étape 4** : Espace personnel (barre latérale, cartes de textes et d'albums, squelettes).

## Dernière action

- **Action exécutée** : Implémentation de la Phase 9 (Aides à l'écriture : syllabes, rimes, mode concentration — T047 à T050) en respectant la constitution, la spec (FR-031 à FR-033) et la liste des tâches.
- **Résultat** : moteurs partagés de syllabes et de rimes françaises, gouttière CodeMirror du décompte syllabique, surlignage coloré des rimes et mode concentration plein écran, 123 tests verts sur la branche `dev`.

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
- **Recherche côté base** : recherche plein texte via `contains` insensible à la casse (Prisma/PostgreSQL) sur le titre et les paroles. Suffisant pour le socle ; à confronter à un index plein texte ou `pg_trgm` si le volume grandit.
- **API minimale `GET /api/songs`** : ajoutée en Phase 4 comme colle nécessaire (le plan ne prévoyait qu'un repository, mais les tests et le dashboard exigent un endpoint). Le reste du CRUD textes (POST/PATCH/DELETE) et l'éditeur ont été ajoutés en Phase 5.
- **Garde d'authentification extraite** : `requireAuth` déplacé dans `apps/api/src/modules/auth/auth.guard.ts` pour être réutilisé par les routes de textes.
- **Éditeur CodeMirror 6 minimaliste** : historique, raccourcis essentiels et retour à la ligne, sans numéros de ligne ni décorations, thème aligné sur Encre & Papier.
- **Sauvegarde automatique résiliente** : debounce 400 ms vers l'API, écriture immédiate du brouillon dans `localStorage` (zéro perte) et reprise automatique au retour de la connexion. Le support hors ligne complet (IndexedDB + PWA, avec copie de conflit) reste à implémenter ultérieurement.
- **`SongDetail`** : le détail d'un texte expose son contenu intégral ; la liste ne renvoie qu'un extrait.
- **Tests d'intégration exécutés séquentiellement** : la base PostgreSQL de test étant partagée, `fileParallelism: false` (configs Vitest racine et `apps/api`) évite les interférences de `deleteMany` entre fichiers.
- **API albums sous `/api/albums`** : la route de réordonnancement est exposée en `PUT /:id/tracks/reorder` (au lieu de `PUT /:id/reorder` évoqué dans la tâche), conformément au contrat `albums-api.md`.
- **Détachement avant suppression** : `deleteAlbum` exécute en transaction la remise à `null` de `albumId`/`positionInAlbum` de tous les textes puis la suppression de l'album, garantissant qu'aucun texte n'est jamais perdu.
- **Tracklist optimiste** : le glisser-déposer réordonne immédiatement l'interface (`arrayMove`) puis persiste l'ordre ; en cas d'échec serveur, la tracklist est rechargée depuis l'API.
- **Pochette d'album non exposée** : `coverImageUrl` est renvoyé à `null` en attendant la signature des URLs S3 (Phase 8) ; la clé `coverImageKey` est bien stockée en base.
- **Archivage des versions côté serveur** : l'instantané est créé dans `updateSong` avant modification, si `createVersion` est demandé, si le contenu/le titre change, ou si la dernière version remonte à plus de 5 minutes. La restauration archive toujours l'état courant avant d'appliquer la révision choisie.
- **Restauration appliquée au contenu local** : l'éditeur met à jour son titre et son contenu depuis la réponse de restauration, puis invalide les caches des versions et de la recherche.
- **Téléversement direct via URLs présignées S3** : le binaire ne transite jamais par l'API. Le backend vérifie l'appartenance et le quota (3 pistes), signe une URL PUT (5 min) puis une URL GET (1 h) à la volée. Clé cloisonnée `users/{userId}/songs/{songId}/{uuid}.ext`.
- **SDK S3 officiel** : `@aws-sdk/client-s3` et `@aws-sdk/s3-request-presigner` avec `forcePathStyle: true` (compatible MinIO en local et Cloudflare R2 en production). La signature des URLs est hors ligne : aucun appel réseau requis pour les générer.
- **Suppression S3 best effort** : la suppression de l'objet binaire est encapsulée et non bloquante (une indisponibilité du stockage n'empêche jamais la suppression en base).
- **Piste active unique** : confirmer ou activer une instrumentale désactive automatiquement toutes les autres du même texte.
- **Métronome Web Audio** : planification des clics par anticipation (lookahead 100 ms, tick de 25 ms) sur l'horloge de l'`AudioContext` pour rester aligné sur la lecture ; boucle de section vérifiée à chaque frame via `requestAnimationFrame`.
- **Format audio** : seuls MP3 (`audio/mpeg`) et WAV (`audio/wav`) sont acceptés, avec une limite de 75 Mo.
- **Moteur de syllabes heuristique** : découpage en groupes de voyelles avec traitement du `e` caduc. Mode `classic` (défaut, versification) et mode `relaxed` (débit rap moderne où les `e` caducs finaux sont élidés). Les diérèses/synérèses lexicales et les formes en `-ent` ne sont pas traitées (un dictionnaire phonétique serait nécessaire).
- **Moteur de rimes phonétique simplifié** : clé extraite de la dernière voyelle tonique avec normalisation des nasales, diphtongues et de la terminaison `[e]` (infinitifs, participes, imparfaits). Analyse sur la graphie, pas sur une transcription phonétique complète.
- **Extensions CodeMirror indépendantes** : la gouttière calcule les syllabes à la volée lors du rendu de marge ; le surlignage des rimes se recalcule uniquement à chaque changement de document (`ViewPlugin`), sans bloquer la frappe.
- **Mode zen via l'API Fullscreen** : l'état est synchronisé avec les événements `fullscreenchange` (sortie par Échap) et les éléments d'interface sont masqués en mode concentration.

## Branche et dernier commit

- **Branche active** : `dev`
- **Dernier commit** : `2194d3b` — `feat: mode concentration plein écran sans distraction`

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
- **Filtres tag/album non exposés dans l'interface** : ils existent côté API, mais la barre de filtres du tableau de bord n'affiche que les statuts (tous/brouillons/terminés/favoris). Les albums disposent en revanche de leur propre section et page de détail.
- **Pochette d'album sans téléversement** : la clé S3 est stockée mais l'interface ne permet pas encore de téléverser une pochette (module audio prévu en Phase 8).
- **Hors ligne partiel** : le brouillon local (`localStorage`) évite toute perte, mais la synchronisation IndexedDB complète avec gestion de conflit n'est pas encore implémentée (PWA prévue ultérieurement).
- **Téléversement S3 non testé contre un vrai stockage** : les tests d'intégration vérifient la signature des URLs et le cycle de vie en base, mais ne poussent pas de binaire (MinIO n'est pas requis par la suite). La configuration CORS du bucket (PUT/GET depuis `CLIENT_URL`) reste à valider en recette.
- **Comptage syllabique approximatif** : les diérèses (`lion`, `Pasiphaé`), les synérèses et les formes verbales en `-ent` (`parlent`) ne sont pas détectées. Le compteur vise une aide à l'écriture, pas une analyse prosodique exacte.
- **Détection de rimes sur la graphie** : quelques homophones irréguliers peuvent échapper au regroupement ; les extensions CodeMirror ne sont pas couvertes par des tests de composants (React Testing Library non configuré).
- **Build web volumineux** : CodeMirror 6 fait dépasser l'avertissement de taille de chunk de Vite (> 500 kB) ; un découpage `manualChunks` sera à prévoir.
- **Pas de tests de composants frontend** : l'éditeur, la sauvegarde automatique et le tableau de bord reposent sur les tests d'API et sur typecheck/lint ; React Testing Library n'est pas encore configuré.
- Toujours vérifier que la branche active est `dev` ou une branche de fonctionnalité avant toute modification.
- Ne jamais commiter de fichier `.env`, de secret ni de fichier audio de test.
- Respecter scrupuleusement le protocole de fin de tâche dans l'ordre strict des 6 étapes.

## Prochaine étape

- **Commande recommandée** : `/speckit-implement` pour la Phase 10 (Export PDF et liens de partage privés — T051 à T054).
- **Prompt recommandé** :
  ```text
  Implémente la phase 10 (export PDF d'antériorité et liens de partage privés — T051 à T054).
  Travaille tâche par tâche, commit par tâche terminée avec un message Conventional
  Commits en français, lance lint et tests, puis pousse sur dev et résume pour validation.
  ```
