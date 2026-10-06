# Verso — Journal de Passation (HANDOFF)

## État actuel

- **Phase en cours** : Refonte Design "Encre & Papier" — Étape 2 (Landing page `/`) terminée et Étape 3 (Pages d'authentification) commitée.
- **Phase d'implémentation Spec Kit** : **Phase 13 (Finitions design, validation end-to-end et audit de sécurité — T060 à T062) terminée**. **Les 13 phases / 62 tâches du plan sont désormais toutes implémentées et testées.**
- **Ce qui est terminé** :
  - Ratification et amendement de la constitution du projet ([.specify/memory/constitution.md](file:///home/normanxcat/Lab/verso/.specify/memory/constitution.md) en version `2.0.0`) avec ses 7 principes non négociables intégrant la collaboration sécurisée.
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
  - **Phase 10 (Export PDF horodaté et liens de partage privés — T051 à T054) implémentée et testée** :
    - Générateur de PDF d'antériorité côté serveur avec `pdfkit` (`apps/api/src/modules/songs/pdf.service.ts`) : titre, auteur, horodatage exact de la dernière révision et texte intégral, avec nom de fichier normalisé (`<titre>-verso-<AAAA-MM-JJ>.pdf`) (T051, FR-040).
    - Route `GET /api/songs/:id/export/pdf` (garde `requireAuth`, cloisonnement par utilisateur) renvoyant un flux `application/pdf` téléchargeable ; test d'intégration `apps/api/tests/integration/pdf-export.test.ts` (3 tests).
    - Schémas Zod et types des liens de partage dans `packages/shared/src/schemas/share.ts` : `createShareLinkSchema`, `shareLinkParamSchema`, `publicShareTokenParamSchema`, types `ShareLinkItem`/`CreatedShareLink`/`PublicSharedSong` et constantes de rate limiting (T052).
    - Service `shares.service.ts` : jetons bruts préfixés `sec_` (32 octets aléatoires) dont seule l'empreinte SHA-256 est stockée, création avec expiration optionnelle, liste, révocation immédiate et consultation anonyme en lecture seule qui incrémente le compteur d'accès (T053, FR-041 à FR-044).
    - Routes `GET/POST /api/songs/:id/share-links`, `DELETE /api/songs/:id/share-links/:linkId` (auteur authentifié) et `GET /api/public/shares/:token` montée sous `/api/public` avec rate limiting strict de 30 requêtes/minute par IP (T053, FR-044).
    - Tests d'intégration `apps/api/tests/integration/shares.test.ts` (13 tests) : création/expiration, non-replay du jeton brut, cloisonnement, consultation anonyme sans donnée personnelle, compteur d'accès, refus des liens expirés/révoqués/inconnus et en-tête `x-ratelimit-limit`.
    - Interface : modale `ShareModal.tsx` (export PDF, génération de lien avec expiration, copie unique du lien, liste et révocation) ouverte depuis l'éditeur, client `share-client.ts`, page publique anonyme `/share/:token` (`PublicSharePage.tsx`) en lecture seule sobre (T054).
    - **Suite de tests totale : 139 tests au vert** (17 fichiers) ; lint, format, typecheck et build de production validés.
  - **Phase 11 (PWA et écriture hors ligne — T055 à T057) implémentée et testée** :
    - Configuration PWA avec `vite-plugin-pwa` dans `apps/web/vite.config.ts` : Service Worker Workbox en `generateSW`, précache de la coquille applicative (HTML, JS, CSS, polices, SVG), `navigateFallback` vers `/index.html` (avec exclusion des routes `/api/*`) et stratégie `NetworkFirst` pour les lectures d'API (cache `verso-api`, repli hors ligne) (T055, FR-045).
    - Manifeste web statique `apps/web/public/manifest.json` (nom, icônes SVG, `display: standalone`, couleurs Encre & Papier) déclaré dans `index.html`, avec métadonnées mobiles (`theme-color`, `apple-mobile-web-app-*`) ; enregistrement du Service Worker via `registerSW` dans `main.tsx` (T055).
    - Couche de persistance locale IndexedDB avec `idb` (`apps/web/src/lib/offline-storage.ts`) : brouillons (`drafts`), cache des textes (`songs`), file d'attente d'actions (`sync-queue`, index `by-song`) et helpers typés ; repli silencieux si IndexedDB est indisponible (T056, FR-046).
    - Résolution de conflit pure `decideSyncAction` (`up-to-date` / `apply-local` / `conflict`) testée dans `apps/web/src/lib/offline-storage.test.ts` (4 tests).
    - Hook `useOfflineSync.ts` (T057, FR-047) : persistance locale immédiate (IndexedDB + `localStorage` en repli), sauvegarde distante debouncée (< 500 ms), file d'attente rejouée au retour du réseau, indicateur de statut enrichi (`enregistré`, `hors ligne`, `conflit`) et compteur d'actions en attente.
    - **Résolution de conflit par duplication** : si le texte a divergé côté serveur pendant la déconnexion, la version distante reste intacte et le contenu local est enregistré dans un nouveau brouillon intitulé `[Titre] (copie hors ligne)`, avec notification informative.
    - Intégration à l'éditeur (`EditorPage.tsx`) : restauration prioritaire du brouillon IndexedDB, mise en cache du texte pour la consultation hors ligne, et `useAutoSave` remplacé par `useOfflineSync` (moteur unique de sauvegarde).
    - Purge du cache local et du cache Workbox d'API à la déconnexion (`clearAllOfflineData`, appelée depuis `useAuth`) pour cloisonner les sessions.
    - **Suite de tests totale : 143 tests au vert** (18 fichiers, dont 4 nouveaux tests web) ; lint, format, typecheck et build de production validés (Service Worker `dist/sw.js` généré, 50 entrées précachées, `dist/manifest.json` lié).
  - **Phase 12 (Bonus : enregistrement vocal freestyle et suggestions de rimes — T058 à T059) implémentée et testée** :
    - Schémas Zod et types des mémos vocaux dans `packages/shared/src/schemas/audio.ts` : formats `MediaRecorder` (`audio/webm`, `audio/mp4`, `audio/ogg`), limite de 25 Mo, `VoiceNoteItem` (T058, FR-048).
    - Repository, service et routes des mémos vocaux (`voice-notes.repository.ts`, `voice-notes.service.ts`, `voice-notes.routes.ts`) : URL présignée PUT cloisonnée (`users/{userId}/songs/{songId}/voice/{uuid}.ext`), confirmation en base, liste avec URL de lecture signée et suppression base + objet S3 (T058).
    - Routes montées sous `/api` : `POST /songs/:id/voice-notes/upload-url`, `POST /songs/:id/voice-notes/confirm`, `GET /songs/:id/voice-notes`, `DELETE /voice-notes/:id` (T058).
    - Tests d'intégration `apps/api/tests/integration/voice-notes.test.ts` (7 tests) : génération d'URL, format refusé, cycle confirmation/liste/suppression, cloisonnement et authentification.
    - Client API `audio-client.ts` enrichi (méthodes mémos vocaux + sélection du meilleur format `MediaRecorder`) et composant `VoiceRecorder.tsx` : capture micro, minuteur, téléversement présigné, liste avec lecture `<audio>` et suppression, intégré sous le lecteur d'instrumentales dans l'éditeur (T058).
    - Base lexicale française embarquée `packages/shared/src/lyrics-engine/rhyme-dict.ts` : plus de 250 mots courants et moteur `findRhymes` classant les rimes riches (suffixe commun ≥ 3 caractères) et suffisantes, testé dans `packages/shared/tests/rhyme-dict.test.ts` (8 tests) (T059, FR-049).
    - Normalisation partagée extraite (`normalizeRhymeWord`) réutilisée par le détecteur de rimes et le dictionnaire.
    - Sélection de mot dans l'éditeur CodeMirror (`LyricEditor.onSelectionChange`) et tiroir latéral `RhymeSuggestionsDrawer.tsx` : ouverture à la sélection d'un mot, groupes « rimes riches » / « rimes suffisantes » et insertion de la rime en un clic (T059).
    - **Suite de tests totale : 158 tests au vert** (20 fichiers) ; lint, format, typecheck et build de production validés.
  - **Phase 13 (Finitions design, validation end-to-end et audit de sécurité — T060 à T062) implémentée et testée** :
    - Bascule de thème renommée et refondue en `apps/web/src/components/common/ThemeToggle.tsx` (chemin exact nommé par T060) : contrôle segmenté « Papier / Encre » accessible (`role="group"`, `aria-pressed`, libellé lecteur d'écran via `sr-only`) et respectueux de `prefers-reduced-motion` ; remplace l'ancien `ThemeSwitch` (7 imports mis à jour).
    - Finitions `apps/web/src/index.css` conformes au skill `frontend-design` : anneau de focus visible cohérent au clavier, sélection de texte teintée à l'accent, barres de défilement discrètes accordées à la palette, rendu typographique optimisé et défilement doux.
    - Durcissement sécurité (T062) : protection CSRF par validation stricte d'origine (`apps/api/src/plugins/csrf.plugin.ts`, hook posé à la racine pour englober toutes les routes) refusant (403) toute écriture dont l'`Origin`/`Referer` de navigateur n'appartient pas à `CLIENT_URL`, en complément des cookies `SameSite=Lax` et du CORS restrictif.
    - Tests d'intégration `apps/api/tests/integration/security.test.ts` (10 tests) : en-têtes Helmet (`x-content-type-options`, `x-frame-options`, `referrer-policy`, `x-dns-prefetch-control`, `cross-origin-opener-policy`, absence de `x-powered-by`), CORS (origine autorisée reflétée avec credentials, origine étrangère jamais reflétée), CSRF (origine étrangère et référent étranger refusés, origine légitime acceptée, requête non-navigateur laissée passer, lecture GET jamais bloquée), isolation multi-tenant anti-IDOR (lecture/modification/suppression d'autrui refusées en 404, texte du propriétaire préservé) et absence de fuite du hash de mot de passe.
    - Dépendance `@fastify/csrf-protection` retirée (non utilisée) ; `apps/api/package.json` et `pnpm-lock.yaml` resynchronisés, README corrigé.
    - Validation complète (T061) : `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (**168 tests / 21 fichiers**) et builds `apps/web` et `apps/api` au vert. Les scénarios de `quickstart.md` sont couverts par les suites d'intégration correspondantes (auth & sessions, CRUD textes + sauvegarde, albums & réordonnancement, instrumentales, PDF & partage privé).
    - **Suite de tests totale : 168 tests au vert** (21 fichiers) ; lint, format, typecheck et builds de production validés.
  - Branche `dev` active.
- **Ce qui est en cours** :
  - Phase 13 terminée. Correctifs visuels (bandeau de vérification email, logotype, barre de navigation) et emails de développement sans Docker : implémentés, testés (`190 tests / 24 fichiers`) et vérifiés visuellement (142 contrôles Playwright, 0 problème).
- **Ce qui reste à faire** :
  - **Refonte Design Étape 4** : Espace personnel (barre latérale, cartes de textes et d'albums, squelettes).
  - **Recette manuelle** : téléversements S3 réels (CORS bucket), OAuth contre les vrais fournisseurs, scénarios `quickstart.md` en navigateur (Service Worker/hors ligne, micro), icônes PWA PNG 192/512.

## Dernière action

- **Action exécutée** : Amendement de la constitution de Verso ([.specify/memory/constitution.md](file:///home/normanxcat/Lab/verso/.specify/memory/constitution.md)) en version `2.0.0` pour intégrer la collaboration sécurisée.
- **Détails de l'amendement** :
  - **Cloisonnement et accès aux données** : Remplacement de la règle d'isolation stricte par : « Un utilisateur n'accède qu'à ses propres données et à celles qui ont été explicitement partagées avec lui, selon son rôle. »
  - **Autorisation centralisée unique (`can`)** : Toute décision d'accès (lecture, écriture, commentaire, partage, suppression) passe par une fonction centrale unique (par exemple `can(utilisateur, ressource, action)`), testée de façon exhaustive. Aucune route ni aucun composant ne contourne cette fonction.
  - **Confidentialité et anti-fuite d'existence** : Réponse identique « introuvable » (HTTP 404) lorsqu'une ressource n'est pas accessible (pas de fuite d'existence).
  - **Gestion des invitations & tokens** : Les invitations sont acceptées explicitement, expirent, et sont révocables. Un lien d'invitation est un token haché en base.
  - **Attribution des modifications & Historique des versions** : Chaque modification d'un texte partagé est attribuée à son auteur. L'historique conserve l'auteur de chaque version.
  - **Protection des utilisateurs, modération & Vie privée** : Un utilisateur peut bloquer un autre utilisateur et signaler un abus. Aucune donnée personnelle (email) n'est révélée à un autre utilisateur sans son accord.
  - **Limitation de débit (Rate Limiting)** : Rate limiting OBLIGATOIRE sur les invitations, commentaires et recherche d'utilisateurs (en plus de l'auth et des liens publics), pour éviter le harcèlement et l'énumération de comptes.
  - **Contenu collaboratif sans injection HTML** : Tout contenu collaboratif (commentaires, noms) est affiché sans injection de HTML (neutralisation XSS stricte).
  - **Tests et Quality Gates** : Exigence de tests exhaustifs pour la fonction centrale d'autorisation `can`, renforcement des standards techniques et enrichissement du palier P3.
- **Résultat** : Constitution mise à jour en version `2.0.0` (incrément MAJOR), `README.md` et `HANDOFF.md` synchronisés.

### Action précédente

- **Action exécutée** : Correctifs visuels (bandeau de vérification email, logotype, barre de navigation) et emails de développement sans Docker.
- **Bandeau de vérification d'email** (`apps/web/src/components/common/EmailVerificationBanner.tsx`) : placé **dans le flux**, en tête du document donc au-dessus de la barre — il ne peut plus la recouvrir. Il publie sa hauteur réelle dans la variable CSS `--banner-h` (`ResizeObserver`) ; la barre fixe se décale de cette valeur tant qu'il est à l'écran puis revient à `0` après 48 px de défilement, et le bouton flottant du mode concentration de l'éditeur s'en décale aussi. Nouveau texte « Vérifie ton adresse email (adresse@exemple.com) pour activer ton compte. » sur **une seule ligne** dès `md` et retour à la ligne propre en dessous ; le bouton « Renvoyer l'email » ne chevauche jamais le texte (rangée en `flex-wrap` sur mobile), passe à l'état « **Email envoyé** » avec un délai de 30 s avant un nouvel envoi (compte à rebours, bouton désactivé), et un **bouton de fermeture** masque le rappel pour la session (`sessionStorage`). Couleurs uniquement issues des jetons (`paper-surface`, `paper-border`, `paper-text`, `paper-muted`, `paper-accent`) — plus aucun marron codé en dur — et `role="status"`.
- **Logotype** (`apps/web/src/components/common/Logo.tsx`, `docs/brand/logo-wordmark.svg`, `apps/web/public/logo-wordmark.svg`) : `logo-wordmark.svg` devient la **source unique** du logotype. Le V signature et le lettrage « erso » sont les **contours réels d'Instrument Serif Regular** (Fontsource) convertis en tracés avec `fontTools`, positionnés dans le repère de la police (unités/1000 em, hauteur de capitale 720) : le V touche le « e » sans trou et le point vermillon, posé sur la ligne de base, est accolé au « o ». Le composant l'intègre **en ligne** (import `?raw`) : l'encre `#14110F` devient `currentColor` (elle suit la couleur du texte et le survol) et le point `#D9421C` devient `var(--color-accent)`. Le lettrage étant vectoriel, le logotype ne dépend **d'aucune fonte à charger** (aucun saut de mise en page possible) ; la fonte d'affichage reste préchargée pour les titres (`apps/web/src/lib/font-preload.ts`, `font-display: swap` de Fontsource, repli Georgia via `font-serif`). Tailles `sm` 20 px / `md` 24 px / `lg` 28 px, proportions du `viewBox` 1989 × 730 (aucune distorsion).
- **Barre de navigation** (`apps/web/src/components/landing/Navbar.tsx` + nouveau `apps/web/src/components/ui/NavLink.tsx`) : **cause identifiée** du « les styles du design system ne s'appliquent pas » — il n'existait aucune primitive de lien dans le design system : les liens étaient stylés au cas par cas (animation sur `width`, donc un reflow, en 200 ms, sans état actif) ; le reset de Tailwind (`text-decoration: inherit`) n'était pas en cause. Le nouveau `NavLink` centralise le style : aucun soulignement natif, texte secondaire au repos et principal au survol, trait vermillon de 1 px dessiné en **150 ms via `transform` (aucun reflow)**, état actif persistant (`aria-current="true"`, section visible détectée à 35 % de l'écran) et focus visible (anneau global). Sélecteur de thème **aplati** : plus de dégradé ni de transparence, fond plat `paper-surface`, segments actifs `paper-bg`/`paper-text`, hauteur **36 px** comme le reste de la barre. Bouton du nom d'utilisateur rendu par `Button` (variante `ghost`, icône `User`) en **police de l'interface** (plus de `font-mono`) et sans soulignement ; « Mon espace » passe en variante `primary` (plus de bloc blanc isolé) ; tous les éléments partagent la même hauteur et la même ligne centrale. Le bouton du menu mobile utilise aussi `Button` (fin du `focus:outline-none` qui supprimait l'anneau de focus).
- **Emails en développement** (`apps/api/src/modules/auth/email.service.ts`, `apps/api/src/config/env.ts`) : hors production et sans transport configuré, l'API affiche dans la console l'**email complet** (de, à, objet, corps et **lien de vérification**) encadré par un bandeau `EMAIL SIMULÉ` — plus besoin de Docker ni de SMTP pour tester l'inscription, et l'inscription n'échoue jamais. En **production**, `RESEND_API_KEY` est obligatoire : `validateEnv` refuse la configuration et `server.ts` arrête le démarrage avec un message explicite ; une branche `blocked` garantit qu'aucun contenu d'email (donc aucun lien de vérification) n'est journalisé si le transport manquait. Le mode de remise est isolé dans la fonction pure `resolveEmailDelivery(nodeEnv, hasTransport)` (`sent` / `simulated` / `blocked`) et testé unitairement.
- **Résultat** : `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (**190 tests / 24 fichiers**) et `pnpm build` au vert, sur la branche `dev`. Vérification Playwright de bout en bout sur le build de production : **142 contrôles, 0 problème** et 24 captures à 375/768/1440 px, en clair et en sombre, avec et sans bandeau, connecté (vérifié et non vérifié) et déconnecté.

### Action précédente

- **Action exécutée** : Correctifs de stabilisation backend et formulaires d'authentification (hors phase Spec Kit).
- **Cause racine du 500** : la base PostgreSQL était injoignable (`DATABASE_URL` invalide — rôle `verso` inexistant / mot de passe incorrect) ; de plus le fichier `.env` de la racine n'était pas chargé lorsque l'API tourne depuis `apps/api`, et aucune erreur non gérée n'était interceptée, si bien que Prisma renvoyait au navigateur un 500 brut avec sa pile et ses détails internes.
- **Corrections apportées** :
  - `apps/api/src/config/env.ts` charge désormais le `.env` le plus proche en remontant depuis le répertoire courant (donc la racine du monorepo quel que soit le cwd) ; en mode test le `.env` machine est ignoré au profit de valeurs déterministes. La validation Zod nomme explicitement chaque variable manquante.
  - `apps/api/src/server.ts` importe l'environnement dans un `try/catch` : en cas de configuration invalide, le serveur s'arrête avec un message clair nommant la variable, sans pile d'appels. Une sonde PostgreSQL non bloquante au démarrage journalise immédiatement une base injoignable.
  - `GET /health` teste réellement la base (`SELECT 1`) : `200 {status:"ok",database:"up"}` ou `503 {status:"error",database:"down"}`.
  - Gestionnaire d'erreurs global (`apps/api/src/plugins/error-handler.ts`) posé à la racine : journalise l'erreur complète (messages et pile masqués des secrets via `redactSecrets`), renvoie un message générique et un identifiant de requête (`requestId`), sans jamais exposer la pile ; les erreurs d'infrastructure (base) deviennent un `503`.
  - L'échec d'envoi d'email de vérification ne fait plus échouer l'inscription : le compte est créé et le message invite à redemander l'envoi (`POST /api/auth/resend-verification`).
  - Nouveaux tests d'intégration `apps/api/tests/integration/robustness.test.ts` (5) : health check, inscription complète, inscription malgré échec email, base indisponible (503 générique + `requestId`, sans fuite) et erreur inattendue (500 générique, sans fuite).
  - Frontend : `apps/web/src/lib/auth-errors.ts` mappe les erreurs en messages français (400 avec détail par champ, 401, 403, 409, 429 avec délai, 500/503, réseau) ; `FormError.tsx` affiche ces messages dans une zone `role="alert"` avec bouton « Réessayer » quand l'erreur est temporaire ; `auth-client.ts` convertit les coupures réseau (statut 0) et conserve `retry-after`.
  - Boutons : `apps/web/src/components/ui/Button.tsx` gère désormais une icône à gauche/droite et l'icône seule (emplacement de 20 px, `shrink-0`, indicateur de chargement qui remplace l'icône) ; boutons OAuth, bascule du mot de passe et bascule de thème unifiés dessus, avec les logos officiels Google (4 couleurs) et ORCID (vert `#A6CE39`).
- **Résultat** : inscription réussie en bout-en-bout avec base correcte (201), base indisponible renvoyant un 503 générique sans fuite, `pnpm lint`/`format:check`/`typecheck` au vert, **178 tests verts** (23 fichiers) et build web validé, sur la branche `dev`.

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
- **PDF d'antériorité généré en mémoire avec `pdfkit`** : le flux est accumulé en `Buffer` puis renvoyé avec `Content-Type: application/pdf` et `Content-Disposition: attachment`. L'horodatage affiché est celui de la dernière révision du texte (`updatedAt`).
- **Jetons de partage jamais stockés en clair** : un jeton brut `sec_<32 octets base64url>` est généré à la création et l'URL complète n'est affichée qu'une seule fois ; seule l'empreinte SHA-256 (`tokenHash`) est conservée en base.
- **Expiration optionnelle des liens** : `expiresInDays` (1 à 365 jours) ou `null` pour un lien sans expiration ; un lien expiré ou révoqué renvoie un message neutre (« Ce lien n'est plus actif ») sans révéler l'existence du texte.
- **Consultation publique sous rate limiting strict** : `GET /api/public/shares/:token` limitée à 30 requêtes par minute par IP (via la configuration de route `@fastify/rate-limit`), sans transmission de cookie de session.
- **Page publique hors authentification** : `/share/:token` est placée hors de la garde `RequireAuth` et affiche le texte en lecture seule avec le nom d'artiste (ou « Artiste Verso ») sans aucune métadonnée personnelle.
- **Service Worker en `generateSW` (Workbox)** : précache de la coquille, `NetworkFirst` sur les lectures d'API (repli cache hors ligne), `navigateFallback` vers `index.html` sauf sous `/api/*`.
- **Manifeste statique plutôt que généré** : `apps/web/public/manifest.json` est servi tel quel (`manifest: false` dans `vite-plugin-pwa`) et déclaré dans `index.html`, pour garder la main sur le contenu.
- **Moteur unique de sauvegarde** : `useOfflineSync` remplace `useAutoSave` (supprimé) dans l'éditeur ; il combine persistance locale IndexedDB, sauvegarde distante debouncée, file d'attente et détection de conflit pour éviter tout double mécanisme concurrent.
- **Détection de conflit côté client sans changement d'API** : avant d'appliquer une action en attente, `GET /api/songs/:id` est rejoué et comparé au contenu de base ; en cas de divergence, la copie `[Titre] (copie hors ligne)` est créée via l'API existante (`POST /api/songs`).
- **Purge à la déconnexion** : `clearAllOfflineData` vide les stores IndexedDB et supprime le cache Workbox `verso-api` pour éviter toute fuite de données entre sessions.
- **Mémos vocaux réutilisant l'infrastructure S3 existante** : même plugin de signatures présignées que les instrumentales, avec un préfixe de clé dédié `.../voice/` (aucun nouveau binaire en base, seul le `s3Key` est stocké).
- **Format d'enregistrement négocié par le navigateur** : `pickVoiceRecorderFormat` sélectionne le premier format `MediaRecorder.isTypeSupported` parmi webm/opus, webm, mp4 et ogg, puis normalise le type MIME accepté par l'API.
- **Dictionnaire de rimes embarqué plutôt qu'un index volumineux** : un lexique curé d'environ 250 mots courants est livré dans le bundle partagé, et la richesse d'une rime est déduite de la longueur du suffixe graphique commun (≥ 3 caractères = riche).
- **Sélection de mot pilotée par CodeMirror** : `LyricEditor` remonte la sélection (`onSelectionChange`) ; l'éditeur ouvre le tiroir de rimes et remplace la sélection par la rime choisie via l'état React partagé (pas d'API impérative).
- **Protection CSRF par validation d'origine plutôt que par jetons** : sur une API JSON à cookies `SameSite=Lax` consommée par une SPA de même origine, la vérification stricte de `Origin`/`Referer` sur les méthodes non sûres (recommandation OWASP) protège efficacement sans imposer un flux de jetons à tous les appels ; les clients non-navigateur (tests `app.inject`, appels serveur à serveur) sont laissés passer car ils ne peuvent pas rejouer de cookie ambiant.
- **Bascule de thème `ThemeToggle`** : renommage de `ThemeSwitch` vers le chemin exact nommé par T060, refondu en contrôle segmenté « Papier / Encre » accessible.
- **Dépendance `@fastify/csrf-protection` retirée** : non utilisée (remplacée par le hook de validation d'origine) ; `pnpm-lock.yaml` resynchronisé.
- **Chargement du `.env` depuis la racine du monorepo** : `dotenv` recherche le `.env` en remontant depuis le cwd (l'API étant lancée depuis `apps/api`), afin que `cp .env.example .env` à la racine suffise ; en mode test, les valeurs de repli déterministes sont utilisées.
- **Erreurs API jamais exposées brutes** : gestionnaire d'erreurs global avec `requestId`, message générique et masquage des secrets dans les journaux ; le frontend mappe les statuts en messages français.
- **Bouton unifié** : un seul composant `Button` (`apps/web/src/components/ui/Button.tsx`) centralise tous les boutons et liens stylés comme des boutons.
  - **API** : `variant` (`primary`/`secondary`/`ghost`/`danger`), `size` (`sm`/`md`/`lg`/`icon`), `iconLeft`, `iconRight`, `loading` (+ alias `isLoading`), `loadingText`, `isSuccess`, `successText`, `shake`, `iconOnly`, `fullWidth`, `asChild` ; `icon`/`iconPosition` conservés pour la rétro-compatibilité.
  - **Géométrie constante** : `inline-flex items-center justify-center gap-2 whitespace-nowrap`, largeur dictée par le contenu (ou `fullWidth`), hauteurs fixes par taille (`sm` 36 px, `md` 44 px, `lg` 48 px, `icon` 36×36) et padding horizontal identique avec ou sans icône.
  - **Icônes** : emplacement unique de 20 px (`shrink-0`, `aria-hidden`) ; une seule icône par bouton. L'icône droite glisse de 2 px au survol (150 ms) et reste immobile sous `prefers-reduced-motion`.
  - **Chargement/succès** : l'indicateur (`Loader2`/`Check`) remplace l'emplacement d'icône sans modifier la largeur ; le bouton est désactivé pendant l'opération.
  - **Rendu uniforme** : `asChild` clone l'unique enfant (ex. `<Link>`) avec les mêmes classes, `aria-disabled` et contenu — un lien a le rendu exact d'un `<button>` (anti-régression du CTA de la landing empilant les SVG).
  - **Usages convertis** : landing (`HeroSection`, `FinalCtaSection`, `Navbar`), tableau de bord, album, partage, thème, champ à icône et pages d'authentification (connexion, inscription, mot de passe oublié, OAuth). Démonstration complète sur `/design` (section 03 Boutons).
  - **Vérification visuelle Playwright** : 126 contrôles analysés sur `/design` et la landing, à 320/768/1280 px en clair et sombre — aucun retour à la ligne, `gap` de 8 px, icônes de 20×20 px, hauteurs 36/44/48 et alignement icône/texte conforme.
- **Bandeau de vérification dans le flux, barre décalée par `--banner-h`** : le bandeau ne recouvre jamais la navigation parce qu'il est rendu **avant** elle dans le flux ; sa hauteur mesurée alimente `--banner-h`, que la barre fixe consomme (`top: var(--banner-h)`) tant qu'il est visible. Fermeture par session (`sessionStorage`) plutôt que définitive : le rappel revient à la prochaine session, sans jamais harceler.
- **`logo-wordmark.svg` comme source unique du logotype** : le mot-symbole est un fichier SVG dont le lettrage est constitué des **tracés réels** d'Instrument Serif (convertis avec `fontTools`), intègre en ligne par le composant `Logo` (import `?raw`). Ce choix supprime toute dépendance à une fonte côté logotype (aucun décalage de mise en page), permet de suivre le thème via `currentColor` et `var(--color-accent)`, et garde un seul artefact de marque à maintenir (`docs/brand/` + `apps/web/public/`).
- **`NavLink`, primitive manquante du design system** : les liens de navigation disposent désormais d'un composant dédié (trait animé par `transform` en 150 ms, état actif `aria-current`, focus visible) au lieu d'utilitaires ad hoc répétés. Le diagnostic est consigné : ce n'était pas le reset de Tailwind mais l'absence de cette primitive.
- **Modes de remise des emails explicites** : `resolveEmailDelivery(nodeEnv, hasTransport)` rend le comportement testable — `sent` (transport configuré), `simulated` (aperçu console hors production), `blocked` (production sans transport, contenu jamais journalisé).
- **Amendement constitutionnel v2.0.0 (Collaboration sécurisée)** : Passage à la version `2.0.0` (incrément MAJOR) actant l'ouverture de Verso au travail collaboratif : substitution de l'isolation exclusive par un modèle d'accès partagé basé sur les rôles, sécurisé par une fonction centrale unique `can(utilisateur, ressource, action)`, une réponse 404 anti-fuite d'existence, la traçabilité des auteurs dans l'historique, des invitations révocables à tokens hachés, la modération/blocage et la protection contre le harcèlement et les injections XSS.

## Branche et dernier commit

- **Branche active** : `dev`
- **Dernier commit** : `20ca602` — `chore: afficher les emails simulés en développement et exiger un transport en production`

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
- `RESEND_API_KEY` : Clé API des emails transactionnels (Resend). **Obligatoire en production** : sans elle le serveur refuse de démarrer (les liens de vérification ne doivent jamais finir dans les journaux de production). Hors production, son absence déclenche l'affichage de l'email complet dans la console.
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
- **Export PDF mono-texte uniquement** : FR-040 mentionne aussi l'export d'un album entier ; seule l'exportation d'un texte individuel est implémentée à ce stade.
- **Polices PDF standard** : le certificat utilise les polices intégrées `Helvetica` (encodage WinAnsi), suffisant pour les accents français ; un encodage/font embarqué serait nécessaire pour des caractères exotiques.
- **Aucun test de composant frontend pour le partage** : `ShareModal` et `PublicSharePage` reposent sur les tests d'API, le typecheck et le lint (React Testing Library non configuré).
- **Hook hors ligne non couvert par des tests de comportement** : seule la décision pure de conflit (`decideSyncAction`) est testée unitairement ; le cycle complet Service Worker/IndexedDB/reconnexion n'est pas automatisé (React Testing Library et un environnement navigateur ne sont pas configurés).
- **Cache d'API Workbox** : les réponses `GET /api/*` sont mises en cache pour la consultation hors ligne et purgées à la déconnexion ; sans déconnexion explicite, elles persistent sur l'appareil (comme les brouillons IndexedDB).
- **Icônes PWA en SVG uniquement** : le manifeste référence `favicon.svg` (`sizes: any`) ; des icônes PNG 192/512 restent à ajouter pour une compatibilité d'installation maximale (iOS notamment).
- **Service Worker inactif en développement** : testable via `pnpm --filter @verso/web build && pnpm --filter @verso/web preview` ; `devOptions` volontairement désactivé pour éviter les caches persistants en dev.
- **Enregistrement vocal non testé automatisé** : `MediaRecorder` et `getUserMedia` exigent un navigateur et un micro réels (React Testing Library non configuré) ; l'API (URL présignée, confirmation, liste, suppression) est couverte par 7 tests d'intégration.
- **Formats d'enregistrement dépendants du navigateur** : le type produit varie (webm/opus sur Chrome/Firefox, mp4 sur Safari) ; l'API accepte webm, mp4 et ogg.
- **Dictionnaire de rimes volontairement restreint** : environ 250 mots courants ; les suggestions se limitent à cette base embarquée et ne couvrent pas l'intégralité du lexique français.
- **Richesse de rime heuristique** : déduite du suffixe graphique commun et non d'une transcription phonétique complète ; quelques classements riches/suffisantes peuvent être approximatifs.
- **Boucle micro non libérée si l'onglet est fermé pendant l'enregistrement** : le composant arrête le flux et le `MediaRecorder` au démontage, mais une fermeture brutale de l'onglet peut laisser la piste active jusqu'à sa révision par le navigateur.
- **Tests de composants frontend limités** : React Testing Library et `jsdom` sont désormais configurés (`@testing-library/react`, `@testing-library/dom`, `jsdom` en devDeps de `@verso/web`) et couvrent le composant `Button` (`Button.test.tsx`) ; l'éditeur, la sauvegarde automatique et le tableau de bord reposent encore sur les tests d'API et sur typecheck/lint. `EmailVerificationBanner`, `Logo`, `NavLink` et `ThemeToggle` sont vérifiés visuellement par Playwright mais n'ont pas encore de test de composant.
- **Bandeau de vérification masquable par session** : le rappel disparaît pour la session du navigateur (`sessionStorage`) une fois fermé ; il réapparaît à la session suivante. Il n'existe volontairement aucune option « ne plus afficher » définitive, car l'adresse non vérifiée bloque la récupération de compte.
- **Vérification Playwright hors dépôt** : le script de vérification visuelle s'appuie sur `playwright-core` installé hors du dépôt (Chromium système), pour ne pas ajouter de dépendance au projet ; les captures ne sont donc pas versionnées.
- **Autres pages d'authentification** : `ResetPasswordPage`, `SessionsPage` et `LinkAccountModal` n'utilisent pas encore `presentAuthError`/`FormError` (seules l'inscription et la connexion ont été traitées) ; à généraliser ultérieurement.
- **Base de données de recette** : le `.env` local peut pointer vers une base PostgreSQL native (le rôle `verso` de `docker-compose` n'existe pas hors Docker) ; `GET /health` et le message de démarrage permettent de le détecter.
- Toujours vérifier que la branche active est `dev` ou une branche de fonctionnalité avant toute modification.
- Ne jamais commiter de fichier `.env`, de secret ni de fichier audio de test.
- Respecter scrupuleusement le protocole de fin de tâche dans l'ordre strict des 6 étapes.

## Prochaine étape

- **Plan Spec Kit complet** : les 13 phases / 62 tâches sont terminées. Aucune phase d'implémentation restante.
- **Travaux suivants recommandés** :
  - **Refonte Design Étape 4** : espace personnel (barre latérale, cartes de textes et d'albums, squelettes).
  - **Recette manuelle** : valider les téléversements S3 (CORS bucket), l'OAuth réel, les scénarios `quickstart.md` en navigateur (micro, hors ligne) et ajouter les icônes PWA PNG 192/512.
  - **Tests de composants** : React Testing Library/`jsdom` est configuré et couvre `Button` ; étendre la couverture à l'éditeur, la sauvegarde hors ligne, le partage et l'enregistrement vocal.
