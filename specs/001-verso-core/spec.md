# Feature Specification: Verso Core Platform

**Feature Branch**: `dev`

**Created**: 2026-10-03

**Status**: Draft

**Input**: User description: "Verso est une application web pour rappeurs permettant d'écrire, organiser, protéger et partager leurs textes. Décris les fonctionnalités suivantes (le quoi, pas la technique), classées par priorité. P1 : socle (Compte et authentification, Espace personnel, Textes, Albums) ; P2 : écriture et musique (Historique des versions, Compteur de syllabes, Repérage des rimes, Mode concentration, Instrus, Lecteur avec boucle, BPM et métronome, Export PDF horodaté, Lien de partage privé révocable) ; P3 : bonus (PWA hors ligne avec synchronisation, Enregistrement vocal freestyle, Suggestions de rimes dictionnaire français). Hors périmètre v1 : collaboration entre utilisateurs, partage public sans lien privé."

## Clarifications

### Session 2026-10-03
- Q: L'accès à l'espace personnel et à l'écriture doit-il être strictement bloqué tant que l'adresse email n'a pas été vérifiée par le lien, ou l'utilisateur peut-il accéder immédiatement à l'application avec un statut restreint ? → A: Accès libre immédiat avec bannière d'avertissement permanente incitant à vérifier l'email, sans bloquer l'écriture ni la connexion.
- Q: Lorsqu'un utilisateur se connecte via Google ou ORCID avec une adresse email correspondant à un compte déjà existant (créé par email/mot de passe), comment le système doit-il gérer la liaison des méthodes d'authentification ? → A: Confirmation par saisie du mot de passe existant requise avant d'autoriser la liaison du compte OAuth (protection contre l'usurpation de compte).
- Q: Quelles limites précises doivent s'appliquer aux fichiers audio d'instrumentales téléversés par l'utilisateur (taille maximale de fichier, formats acceptés et nombre d'instrus par texte) ? → A: Taille maximale de 75 Mo par fichier, formats MP3 et WAV acceptés, et possibilité d'attacher jusqu'à 3 instrus différentes par texte (ex. versions avec/sans refrain, démo, arrangement alternatif).
- Q: Lors du rétablissement de la connexion après une session d'écriture hors ligne, comment le système doit-il résoudre un conflit si le même texte a également été modifié sur un autre appareil pendant la déconnexion ? → A: Duplication en brouillon de conflit : le texte distant reste inchangé et la version hors ligne est enregistrée comme un nouveau brouillon distinct nommé "[Titre] (copie hors ligne)" avec notification informative.
- Q: Quelle politique de conservation et de limitation doit s'appliquer à l'historique des versions d'un texte (durée de rétention et nombre maximal de révisions conservées) ? → A: Conservation intégrale absolue : aucune purge et aucun plafond de nombre de versions, toutes les versions horodatées enregistrées sont conservées indéfiniment pour chaque texte.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Première inscription et validation de compte (Priority: P1)

En tant que rappeur découvrant Verso, je souhaite créer un compte personnel sécurisé et vérifier mon adresse email afin d'avoir mon espace d'écriture privé réservé.

**Why this priority**: C'est le point d'entrée incontournable garantissant l'identité de l'auteur, l'étanchéité des données et la protection de ses œuvres.

**Independent Test**: Peut être testé isolément en créant un compte via formulaire ou OAuth, en validant l'email et en confirmant l'accès au tableau de bord personnel.

**Acceptance Scenarios**:

1. **Given** un visiteur non authentifié, **When** il saisit son email et un mot de passe valide et soumet le formulaire, **Then** son compte est créé à l'état non vérifié, un email de confirmation contenant un lien unique est émis, et il accède immédiatement à son espace personnel avec une bannière d'avertissement persistante l'invitant à valider son adresse.
2. **Given** un utilisateur ayant reçu un lien de vérification d'email valide, **When** il clique sur ce lien avant expiration, **Then** son adresse email est marquée comme vérifiée et il est redirigé vers son espace connecté.
3. **Given** un utilisateur existant ayant créé son compte avec email/mot de passe, **When** il tente une première connexion via Google ou ORCID avec la même adresse email, **Then** le système lui demande de saisir son mot de passe existant pour valider explicitement l'association du fournisseur OAuth à son compte sans duplication.
4. **Given** un utilisateur connecté sur plusieurs appareils, **When** il consulte la gestion de ses sessions, **Then** il visualise chaque appareil/session active et peut révoquer individuellement ou globalement les autres sessions.

---

### User Story 2 - Première écriture d'un texte avec sauvegarde automatique continue (Priority: P1)

En tant qu'auteur de rap en pleine session d'inspiration, je veux ouvrir un nouvel éditeur, taper mes couplets et constater que chaque mot est sauvegardé en continu sans que j'aie à appuyer sur un bouton et sans risque de perte.

**Why this priority**: L'écriture est le cœur de valeur de l'application. La garantie de ne jamais perdre une rime ou un texte est la promesse fondamentale de Verso.

**Independent Test**: Créer un texte, saisir des rimes, couper la connexion réseau, reprendre la frappe et constater la persistance locale et la resynchronisation sans aucune perte de texte.

**Acceptance Scenarios**:

1. **Given** un utilisateur connecté dans son espace personnel, **When** il clique sur "Nouveau texte", **Then** un éditeur épuré s'ouvre immédiatement avec le statut "Brouillon".
2. **Given** un auteur en train de rédiger des paroles, **When** il tape ou modifie du contenu, **Then** la sauvegarde automatique s'exécute silencieusement en arrière-plan, les compteurs de mots et de lignes s'ajustent en direct, et un indicateur discret confirme la sauvegarde.
3. **Given** un texte terminé, **When** l'auteur modifie son statut de "Brouillon" à "Terminé", **Then** le statut est conservé et reflété dans les filtres de son espace personnel.

---

### User Story 3 - Organisation des textes et création d'un album (Priority: P1)

En tant qu'artiste structurant un projet musical, je souhaite regrouper mes morceaux dans un album, agencer la tracklist par glisser-déposer et retrouver mes textes par mots-clés ou tags.

**Why this priority**: Permet à l'artiste de passer de la simple écriture de couplets isolés à la conceptualisation d'un projet artistique structuré (EP, album, mixtape).

**Independent Test**: Créer un album, lui associer 3 textes existants, modifier leur ordre d'apparition par glisser-déposer, et filtrer les textes par album ou par tag.

**Acceptance Scenarios**:

1. **Given** un utilisateur sur son espace personnel, **When** il crée un album avec un titre et une description, **Then** l'album apparaît dans sa discothèque personnelle.
2. **Given** un album existant, **When** l'auteur y associe des textes et les réorganise par glisser-déposer, **Then** le nouvel ordre de la tracklist est immédiatement sauvegardé et affiché.
3. **Given** un ensemble de textes avec différents tags (ex: "Colère", "Mélancolie", "Freestyle"), **When** l'auteur recherche un terme ou active un filtre de tag, **Then** la liste affiche instantanément les textes correspondants.

---

### User Story 4 - Association d'une instru audio et confort d'écoute en écriture (Priority: P2)

En tant que rappeur travaillant sur une production musicale, je veux importer mon instru audio (MP3/WAV), renseigner le tempo (BPM) et la tonalité, et lancer une boucle sur une section précise pendant que j'écris.

**Why this priority**: L'écriture de rap est indissociable du rythme et de la métrique musicale. Disposer d'un lecteur intégré avec boucle évite d'alterner entre plusieurs applications.

**Independent Test**: Téléverser un fichier audio sur un texte, spécifier un BPM de 90, définir une boucle de 8 mesures, activer la lecture en boucle et taper du texte en continu.

**Acceptance Scenarios**:

1. **Given** un texte ouvert dans l'éditeur, **When** l'artiste téléverse un fichier MP3 ou WAV respectant la limite de taille, **Then** l'instru est attachée au texte et le lecteur audio intégré devient actif.
2. **Given** une instru en lecture, **When** l'artiste délimite une boucle (début et fin) sur le lecteur, **Then** la lecture se répète indéfiniment sur cet intervalle sans interrompre la saisie de texte.
3. **Given** un texte avec un BPM renseigné, **When** l'artiste active le métronome intégré, **Then** une pulsation visuelle et sonore au tempo configuré démarre pour l'aider à caler son débit.

---

### User Story 5 - Restauration d'une version antérieure et analyse métrique (Priority: P2)

En tant que lyriciste exigeant, je veux compter les syllabes par ligne, repérer les rimes colorées et pouvoir revenir à une version précédente de mon texte si une rature ou un remaniement ne me convient plus.

**Why this priority**: Perfectionne la technique d'écriture rap (placement, schéma de rimes) et supprime la peur de supprimer de bons passages grâce à l'historique infaillible.

**Independent Test**: Modifier un texte plusieurs fois, ouvrir l'historique des versions, visualiser les différences, et restaurer avec succès la version d'il y a 10 minutes.

**Acceptance Scenarios**:

1. **Given** un texte rédigé, **When** l'auteur consulte les métriques d'écriture, **Then** le nombre de syllabes est affiché en marge de chaque ligne et les rimes similaires sont surlignées par une couleur distinctive.
2. **Given** un texte modifié au fil du temps, **When** l'auteur ouvre l'historique des versions, **Then** il accède à la liste horodatée de chaque révision enregistrée avec un aperçu comparatif.
3. **Given** la sélection d'une version antérieure dans l'historique, **When** l'artiste confirme la restauration, **Then** le contenu de cette version devient l'état courant de son texte, sans écraser l'historique précédent.

---

### User Story 6 - Preuve d'antériorité et partage privé révocable (Priority: P2)

En tant qu'auteur voulant faire écouter ou lire son texte à un beatmaker ou à un proche sans risquer le vol, je souhaite générer un lien privé en lecture seule révocable et exporter un PDF certifié par horodatage.

**Why this priority**: Protège la propriété intellectuelle de l'artiste avant la sortie commerciale ou le dépôt formel, tout en permettant le feedback de collaborateurs choisis.

**Independent Test**: Générer un lien de partage pour un texte, l'ouvrir dans un navigateur anonyme en lecture seule, vérifier l'absence d'accès aux autres textes de l'auteur, puis révoquer le lien et constater l'inaccessibilité immédiate.

**Acceptance Scenarios**:

1. **Given** un texte finalisé, **When** l'auteur clique sur "Exporter en PDF", **Then** un document sobre et élégant est produit, incluant le titre, le texte intégral, l'auteur, et la date exacte de la dernière révision horodatée.
2. **Given** un texte privé, **When** l'auteur génère un lien de partage privé, **Then** un lien secret unique est créé, paramétrable avec une date d'expiration optionnelle.
3. **Given** un destinataire ouvrant un lien de partage valide, **When** la page se charge, **Then** le texte s'affiche en lecture seule sobre, sans aucune option de modification, sans afficher les données personnelles de l'auteur, et avec un rate limiting actif.
4. **Given** un lien de partage actif, **When** l'auteur clique sur "Révoquer le lien", **Then** toute tentative future d'ouverture du lien renvoie immédiatement une erreur d'accès sans révéler le contenu.

---

### User Story 7 - Écriture nomade hors ligne avec synchronisation (Priority: P3)

En tant qu'artiste en studio souterrain ou en avion sans réseau, je souhaite ouvrir l'application installée sur mon smartphone, écrire de nouveaux textes, enregistrer une maquette vocale rapide et voir mes modifications se synchroniser automatiquement dès le retour du réseau.

**Why this priority**: Offre une liberté totale de création artistique sur mobile en tout lieu sans dépendre d'une connexion internet.

**Independent Test**: Passer l'appareil en mode avion, ouvrir Verso en PWA, créer un texte, enregistrer un mémo vocal freestyle, reconnecter l'appareil au réseau et observer la synchronisation transparente vers le compte distant.

**Acceptance Scenarios**:

1. **Given** un utilisateur sur smartphone, **When** il visite Verso, **Then** l'application lui propose une installation PWA sur son écran d'accueil avec chargement instantané.
2. **Given** l'application en mode hors ligne (sans réseau), **When** l'auteur crée ou modifie un texte, **Then** toutes les modifications sont enregistrées localement sans aucun message bloquant.
3. **Given** un texte rédigé hors ligne, **When** la connexion réseau est rétablie, **Then** la synchronisation s'effectue automatiquement en arrière-plan sans conflit ni perte de données.
4. **Given** un texte ouvert, **When** l'artiste clique sur "Enregistrer un freestyle", **Then** le micro s'active, capture la voix et attache la note vocale directement au texte.
5. **Given** l'éditeur en cours d'utilisation, **When** l'auteur recherche une rime sur un mot en français, **Then** un panneau latéral lui propose des suggestions de rimes riches et suffisantes issues du dictionnaire français.

---

### Edge Cases

- **Coupure réseau brutale en plein milieu d'une phrase** : Le système conserve immédiatement la frappe dans la mémoire locale de l'appareil et réessaie la persistance distante dès que possible sans afficher de modale intrusive d'erreur.
- **Conflit de modification hors ligne vs distant** : Si le même texte a été modifié sur un autre appareil pendant la déconnexion, la synchronisation préserve le texte distant intact et crée automatiquement une copie en brouillon nommée "[Titre] (copie hors ligne)" avec une notification discrète invitant l'artiste à comparer.
- **Dépassement de la taille limite de fichier audio** : Le téléversement est refusé immédiatement côté client et côté serveur avec un message explicite si le fichier dépasse 75 Mo ou n'est pas au format MP3/WAV.
- **Lien de partage expiré ou révoqué** : La page de consultation affiche un message neutre ("Ce lien n'est plus actif") sans donner d'information sur l'auteur ou le statut du texte.
- **Suppression d'un album contenant des textes** : La suppression de l'album ne supprime JAMAIS les textes associés ; ils sont simplement détachés de l'album et conservés dans l'espace personnel.

---

## Requirements *(mandatory)*

### Functional Requirements

#### 1. Compte, Authentification & Sessions (Priorité P1)

- **FR-001**: Le système DOIT permettre l'inscription par adresse email et mot de passe sécurisé.
- **FR-002**: Le système DOIT envoyer un email contenant un lien unique de vérification d'adresse avec expiration stricte. L'accès à l'espace personnel et à l'écriture reste immédiatement ouvert après l'inscription, avec affichage d'une bannière d'avertissement persistante invitant l'utilisateur à vérifier son compte.
- **FR-003**: Le système DOIT permettre la connexion par identifiant (email/mot de passe) et maintenir la session active sur l'appareil selon le choix de l'utilisateur ("Rester connecté").
- **FR-004**: Le système DOIT permettre la déconnexion explicite de la session courante.
- **FR-005**: Le système DOIT proposer une procédure de réinitialisation de mot de passe par envoi d'un lien temporaire à usage unique par email.
- **FR-006**: Le système DOIT supporter l'authentification et l'inscription via des fournisseurs tiers réputés (Google, ORCID).
- **FR-007**: Le système DOIT permettre de lier plusieurs méthodes d'authentification (email/mot de passe, Google, ORCID) au même compte utilisateur sans créer de doublon. Si un compte existe déjà lors d'une connexion OAuth avec la même adresse email, la saisie préalable du mot de passe du compte existant DOIT être exigée pour autoriser la liaison.
- **FR-008**: Le système DOIT afficher la liste complète des sessions actives de l'utilisateur (avec informations indicatives de type d'appareil, date de dernière activité et localisation approximative).
- **FR-009**: L'utilisateur DOIT pouvoir révoquer à distance n'importe quelle session active, individuellement ou toutes à l'exception de la session courante.
- **FR-010**: Le système DOIT appliquer une limitation stricte de débit (rate limiting) sur toutes les tentatives d'authentification et requêtes de réinitialisation.

#### 2. Espace Personnel & Navigation (Priorité P1)

- **FR-011**: L'espace connecté DOIT présenter un tableau de bord épuré listant les textes récents, les brouillons, les albums et les favoris.
- **FR-012**: Le système DOIT fournir un moteur de recherche en temps réel interrogeant à la fois les titres et le corps des paroles des textes de l'utilisateur.
- **FR-013**: Le système DOIT proposer des filtres d'affichage combinables : Tous les textes, Brouillons uniquement, Textes terminés, Textes favoris, Par album, Par tag.
- **FR-014**: L'espace personnel DOIT afficher pour chaque texte son titre, son statut, son album de rattachement éventuel, sa date de dernière modification et ses tags.

#### 3. Gestion des Textes & Éditeur (Priorité P1)

- **FR-015**: L'utilisateur DOIT pouvoir créer, modifier et supprimer un texte à tout moment.
- **FR-016**: Chaque texte DOIT comporter un titre et un contenu textuel (paroles).
- **FR-017**: Chaque texte DOIT avoir un état explicite : soit "Brouillon", soit "Terminé".
- **FR-018**: L'éditeur DOIT exécuter une sauvegarde automatique en continu dès la moindre modification, sans interrompre la saisie.
- **FR-019**: L'éditeur DOIT afficher en temps réel le décompte exact du nombre de mots et du nombre de lignes du texte.
- **FR-020**: L'utilisateur DOIT pouvoir marquer un texte comme "Favori" pour un accès rapide.
- **FR-021**: L'utilisateur DOIT pouvoir attribuer des tags personnalisés à chaque texte (ex: thème, ambiance, humeur, style).
- **FR-022**: Tous les textes DOIVENT être strictement privés par défaut ; aucun texte n'est accessible publiquement ou à un autre utilisateur sans partage privé explicite.

#### 4. Gestion des Albums (Priorité P1)

- **FR-023**: L'utilisateur DOIT pouvoir créer un album avec un titre obligatoire, une description optionnelle et une image de pochette optionnelle.
- **FR-024**: L'utilisateur DOIT pouvoir ajouter un ou plusieurs textes existants à un album ou créer un nouveau texte directement rattaché à l'album.
- **FR-025**: Un texte DOIT pouvoir exister de manière autonome sans être rattaché à aucun album.
- **FR-026**: L'utilisateur DOIT pouvoir modifier l'ordonnancement des morceaux au sein de l'album par glisser-déposer intuitif.
- **FR-027**: La suppression d'un album DOIT détacher les textes qui y étaient associés sans jamais les supprimer du compte utilisateur.
- **FR-028**: L'utilisateur DOIT pouvoir retirer un texte d'un album sans supprimer le texte lui-même.

#### 5. Confort d'Écriture & Analyse Métrique (Priorité P2)

- **FR-029**: Le système DOIT enregistrer un historique horodaté immuable des versions de chaque texte au fil des modifications. Toutes les versions enregistrées DOIVENT être conservées indéfiniment, sans aucune purge automatique ni plafond sur le nombre de versions archivées.
- **FR-030**: L'utilisateur DOIT pouvoir consulter l'historique, prévisualiser une version antérieure et la restaurer comme version active.
- **FR-031**: L'éditeur DOIT proposer un compteur de syllabes en marge de chaque ligne pour aider à la régularité métrique.
- **FR-032**: L'éditeur DOIT être capable de détecter et colorer automatiquement les rimes et terminaisons phonétiques similaires pour visualiser les schémas de rimes.
- **FR-033**: L'éditeur DOIT proposer un "Mode Concentration" (zen mode) plein écran masquant tous les éléments d'interface parasites pour isoler l'auteur avec son texte.

#### 6. Instrumentales & Confort Audio (Priorité P2)

- **FR-034**: L'utilisateur DOIT pouvoir téléverser des fichiers audio aux formats MP3 ou WAV jusqu'à 75 Mo par fichier. Le système DOIT permettre d'attacher jusqu'à 3 instrumentales distinctes par texte (ex. version avec refrain, démo, variante d'arrangement) et d'en désigner une comme piste active pour l'écoute.
- **FR-035**: L'utilisateur DOIT pouvoir écouter l'instru active directement dans l'éditeur pendant qu'il rédige ses paroles.
- **FR-036**: Le lecteur audio DOIT permettre de définir une boucle sur un segment audio précis (point de départ et point de fin) avec répétition continue.
- **FR-037**: L'utilisateur DOIT pouvoir renommer, remplacer ou supprimer chacune des instrumentales associées à un texte à tout moment.
- **FR-038**: L'utilisateur DOIT pouvoir renseigner et modifier le tempo (BPM) et la tonalité musicale de l'instru associée.
- **FR-039**: L'éditeur DOIT intégrer un métronome sonore et visuel réglable sur le tempo souhaité.

#### 7. Preuve d'Antériorité & Liens de Partage Privés (Priorité P2)

- **FR-040**: Le système DOIT permettre l'exportation au format PDF d'un texte individuel ou de l'intégralité d'un album, avec mention claire du titre, des paroles, de l'artiste et de l'horodatage précis de la dernière révision.
- **FR-041**: L'utilisateur DOIT pouvoir générer un lien de partage privé unique pour un texte donné, strictement en consultation seule (lecture seule).
- **FR-042**: L'utilisateur DOIT pouvoir définir une date d'expiration optionnelle sur le lien de partage privé.
- **FR-043**: L'utilisateur DOIT pouvoir révoquer instantanément un lien de partage à tout moment.
- **FR-044**: La consultation d'un texte via lien de partage DOIT faire l'objet d'une limitation de débit (rate limiting) et ne DOIT donner aucun accès aux autres œuvres ou informations personnelles de l'auteur.

#### 8. Mobilité PWA, Enregistrement & Dictionnaire (Priorité P3)

- **FR-045**: L'application DOIT être installable en tant que Progressive Web App (PWA) sur ordinateurs et appareils mobiles.
- **FR-046**: L'application DOIT permettre l'ouverture, la consultation et la rédaction complète de textes en mode hors ligne.
- **FR-047**: Le système DOIT synchroniser automatiquement les modifications locales avec le compte distant dès le rétablissement de la connexion. En cas de conflit (texte également modifié sur un autre appareil pendant la déconnexion), le système DOIT préserver le texte distant intact et enregistrer la version hors ligne sous la forme d'un nouveau brouillon distinct intitulé `[Titre] (copie hors ligne)`.
- **FR-048**: L'utilisateur DOIT pouvoir enregistrer une note vocale (freestyle ou mémo de flow) via le microphone de son appareil et l'associer au texte courant.
- **FR-049**: L'éditeur DOIT intégrer un dictionnaire de rimes de la langue française fournissant des suggestions de rimes riches et suffisantes basées sur la phonétique du mot sélectionné.

---

### Key Entities *(include if feature involves data)*

- **Utilisateur (User)** : Représente l'auteur/rappeur propriétaire du compte. Attributs : identifiant unique, adresse email vérifiée, mot de passe haché ou identifiants externes (Google, ORCID), date d'inscription, préférences d'affichage (thème sombre/clair).
- **Session Active (Session)** : Représente une connexion active sur un navigateur/appareil. Attributs : identifiant de session, association utilisateur, empreinte appareil/navigateur, adresse IP indicative, date de création, date de dernière activité, date d'expiration.
- **Texte (Song / Lyric)** : Entité centrale contenant l'œuvre écrite. Attributs : identifiant, association utilisateur, rattachement album optionnel, titre, contenu des paroles, statut (brouillon ou terminé), indicateur favori, tags, dates de création et de dernière modification.
- **Version de Texte (SongVersion)** : Instantané immuable d'un texte dans le temps, conservé indéfiniment sans purge ni plafond. Attributs : identifiant, association au texte d'origine, titre archivé, contenu archivé, horodatage précis de capture.
- **Album (Album)** : Regroupement thématique de textes. Attributs : identifiant, association utilisateur, titre de l'album, description, référence visuelle de pochette, ordre des pistes, date de création.
- **Piste d'Album (AlbumTrack)** : Association ordonnée entre un album et un texte. Attributs : référence album, référence texte, position ordonnée (numéro de piste).
- **Instrumentale (AudioTrack)** : Fichier audio associé à un texte. Attributs : identifiant, association texte, référence de stockage du fichier binaire, format, durée, tempo (BPM), tonalité musicale.
- **Lien de Partage (ShareLink)** : Droit de lecture confidentiel pour un tiers. Attributs : identifiant, association texte, token d'accès haché, date de création, date d'expiration optionnelle, statut actif/révoqué.
- **Note Vocale (VoiceMemo)** : Enregistrement sonore court lié à un texte. Attributs : identifiant, association texte, référence de stockage du fichier audio vocal, durée, date d'enregistrement.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un nouvel utilisateur peut s'inscrire, valider son compte et rédiger son tout premier texte en moins de 3 minutes.
- **SC-002**: L'éditeur sauvegarde chaque mot en moins de 500 millisecondes après la frappe, avec un taux de perte de données strictement égal à 0%, même lors d'une déconnexion réseau simulée.
- **SC-003**: 95% des actions de recherche de paroles ou de filtrage par tag ou statut retournent les résultats instantanément (en moins de 200 millisecondes).
- **SC-004**: L'ouverture et la manipulation de la tracklist d'un album de 20 morceaux par glisser-déposer s'effectuent sans aucune latence perçue par l'utilisateur.
- **SC-005**: Le lecteur d'instru audio démarre la lecture et reboucle sur la section délimitée avec une précision temporelle parfaite, sans interruption ni saccade pendant la frappe de l'auteur.
- **SC-006**: La révocation d'un lien de partage privé ou d'une session distante prend effet immédiatement (100% de blocage des requêtes suivantes sur ce lien ou cette session).
- **SC-007**: En mode PWA hors ligne, 100% des modifications de texte apportées sans réseau sont préservées localement et synchronisées avec succès dès la reconnexion.
- **SC-008**: 100% des textes non partagés explicitement demeurent totalement inaccessibles à tout utilisateur tiers ou visiteur non authentifié.

---

## Assumptions

- **Limites de taille et formats audio** : Les fichiers d'instrumentales téléversés sont limités à 75 Mo par fichier aux formats MP3 et WAV, avec un maximum de 3 instrumentales associables par texte.
- **Périmètre v1 strictly respecté** : La collaboration en temps réel entre utilisateurs et la publication publique de textes dans un catalogue ouvert sont explicitement hors périmètre de cette version.
- **Langue de l'analyse poétique** : Le calcul métrique des syllabes et le dictionnaire de rimes ciblent en priorité la langue française et ses spécificités phonétiques et élisions poétiques usuelles.
- **Preuve d'antériorité PDF** : L'export PDF intègre un horodatage textuel de la version sans valeur d'autorité de certification cryptographique légale d'État, mais constitue un document formel d'antériorité de création pour l'artiste.
- **Isolement des données** : Chaque utilisateur dispose d'un espace hermétique ; aucune donnée textuelle ou musicale n'est accessible par un tiers sans création explicite d'un lien de partage privé par l'auteur.
