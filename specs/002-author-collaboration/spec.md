# Feature Specification: Collaboration entre Auteurs (Author Collaboration)

**Feature Branch**: `002-author-collaboration`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "Ajouter la collaboration entre auteurs dans Verso. Décris le quoi, pas la technique, par priorité. P1 : partage et commentaires (invitations, rôles, gestion accès, espace 'Partagés avec moi', commentaires sur lignes/sélection, attribution des versions, notifications in-app/email, gestion des conflits). P2 : crédits et studio (crédits avec parts %, export PDF, profil auteur minimal sans email visible, blocage/signalement, activité récente). P3 : temps réel (écriture simultanée, curseurs colorés, présence, mode session avec instru et métronome partagés). Hors périmètre : discussions publiques, réseau social, marketplace, collaboration sans compte."

## Clarifications

### Session 2026-10-06
- Q: Que doivent devenir les textes partagés et leurs révisions lorsqu'un auteur propriétaire décide de supprimer définitivement son compte Verso ? → A: Transfert automatique de la propriété au co-auteur le plus ancien sur le texte, qui hérite de l'intégralité des droits d'administration de l'œuvre.
- Q: Qu'advient-il de l'accès et des contributions d'un co-auteur lorsqu'il décide de quitter un projet ou que le propriétaire révoque son accès ? → A: Les paroles restent intégrées au texte et à l'historique des versions, mais l'accès au projet est immédiatement fermé sans création de copie personnelle, et tous ses commentaires et discussions passés sont anonymisés ou purgés de l'espace de travail.
- Q: Quels doivent être les droits accordés aux co-auteurs sur les instrumentales audio associées à un texte partagé ? → A: Les co-auteurs disposent de droits complets sur les instrumentales associées au texte, équivalents à ceux du propriétaire (importation dans la limite du quota global de 3 pistes, sélection de la piste active, modification des métadonnées et suppression définitive).
- Q: Comment le système doit-il concilier deux modifications concurrentes sur un même texte partagé en cas de conflit asynchrone pour garantir le zéro perte de paroles ? → A: La première modification reçue met à jour le texte courant ; la modification concurrente est automatiquement archivée comme version spéciale étiquetée « Conflit » dans l'historique du texte partagé, avec notification aux co-auteurs et vue comparative.
- Q: Quel doit être l'impact immédiat du blocage d'un utilisateur sur les projets et textes partagés sur lesquels les deux artistes collaborent déjà ? → A: Le blocage révoque immédiatement l'accès de l'utilisateur bloqué sur les œuvres dont le bloqueur est propriétaire ; si le bloqueur collaborait sur une œuvre du bloqué, il la quitte immédiatement ; sur les œuvres d'un tiers où tous deux collaborent, leurs mentions, notifications et échanges directs sont mutuellement neutralisés et invisibilisés.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inviter des collaborateurs et gérer les accès aux œuvres (Priority: P1)

En tant qu'auteur propriétaire d'un texte ou d'un album, je souhaite inviter d'autres auteurs par leur nom d'utilisateur ou leur adresse email en leur attribuant un rôle précis (co-auteur, commentateur ou lecteur), consulter la liste des personnes ayant accès, ajuster leurs privilèges ou révoquer leur accès à tout moment, afin de maîtriser avec qui je partage mon travail d'écriture.

**Why this priority**: C'est le socle fondamental de toute collaboration sécurisée. Sans attribution explicite de rôles et validation réciproque, aucune écriture partagée ni échange critique n'est possible dans le respect de la propriété artistique.

**Independent Test**: Peut être testé de manière autonome en créant un texte, en envoyant une invitation à un collaborateur, en vérifiant la notification reçue, l'acceptation par l'invité et la consultation du texte avec les droits strictement conformes au rôle accordé.

**Acceptance Scenarios**:

1. **Given** un auteur propriétaire d'un texte, **When** il saisit le nom d'utilisateur ou l'email d'un autre utilisateur avec le rôle "Co-auteur", **Then** une invitation est générée avec expiration, une notification est envoyée à l'invité, et le statut reste "En attente" sans donner accès immédiat au texte.
2. **Given** un utilisateur ayant reçu une invitation de collaboration, **When** il consulte ses invitations en attente et choisit d'"Accepter", **Then** l'accès lui est ouvert selon le rôle convenu et le texte apparaît dans sa collection collaborative.
3. **Given** un utilisateur ayant reçu une invitation, **When** il choisit de la "Refuser", **Then** l'invitation est archivée comme refusée, aucun accès n'est concédé et le propriétaire est notifié du refus.
4. **Given** un auteur propriétaire d'une œuvre partagée, **When** il consulte le panneau des accès, **Then** il visualise tous les collaborateurs actifs et en attente, peut modifier le rôle d'un membre (ex. de "Commentateur" à "Co-auteur") ou révoquer son accès.
5. **Given** un collaborateur invité sur un texte (co-auteur, commentateur ou lecteur), **When** il décide de "Quitter le projet", **Then** son accès est immédiatement interrompu et l'œuvre disparaît de son espace partagé, tandis que ses contributions passées restent créditées.
6. **Given** un auteur propriétaire d'un album, **When** il invite un collaborateur sur l'album entier, **Then** les permissions s'appliquent en cascade sur l'ensemble des morceaux actuels et futurs de cet album.

---

### User Story 2 - Consulter et filtrer les œuvres partagées (Priority: P1)

En tant qu'auteur invité sur plusieurs œuvres, je souhaite disposer d'une vue dédiée "Partagés avec moi" au sein de mon espace personnel, avec des options de filtrage par rôle et par propriétaire, afin de retrouver instantanément mes collaborations sans les confondre avec mes textes purement personnels.

**Why this priority**: Permet aux artistes prolifiques de séparer nettement leurs projets solos de leurs projets collectifs, évitant les erreurs de manipulation et clarifiant la gestion du catalogue personnel.

**Independent Test**: Testable indépendamment en consultant l'espace "Partagés avec moi" avec un compte invité sur plusieurs textes et albums, en appliquant les filtres (par propriétaire, par rôle : co-auteur, commentateur, lecteur) et en vérifiant la liste affichée.

**Acceptance Scenarios**:

1. **Given** un auteur connecté ayant accepté des collaborations, **When** il accède à l'onglet "Partagés avec moi", **Then** la liste présente l'ensemble des textes et albums dont il n'est pas le propriétaire mais sur lesquels il dispose d'un rôle actif.
2. **Given** la vue "Partagés avec moi", **When** l'utilisateur filtre par le rôle "Co-auteur", **Then** seuls les textes sur lesquels il détient des droits de modification sont présentés.
3. **Given** la vue "Partagés avec moi", **When** l'utilisateur filtre par un propriétaire spécifique, **Then** seuls les textes initiés par cet artiste s'affichent.
4. **Given** un texte partagé pour lequel l'accès a été révoqué par le propriétaire, **When** l'utilisateur rafraîchit son espace, **Then** le texte a disparu de la liste et toute tentative d'accès direct renvoie un état introuvable.

---

### User Story 3 - Échanger par commentaires contextualisés et mentions (Priority: P1)

En tant qu'auteur, co-auteur ou commentateur, je souhaite sélectionner une ligne ou un passage de texte pour y attacher un commentaire, mentionner un collaborateur par `@pseudonyme`, recevoir des réponses sous forme de fil de discussion et marquer le point comme "résolu", afin de faire évoluer le texte de manière constructive sans altérer les paroles.

**Why this priority**: Le retour critique et la relecture ligne à ligne constituent l'essence du travail d'équipe en écriture de rap (placement, schéma de rimes, pertinence d'une punchline) avant validation définitive.

**Independent Test**: Testable isolément en sélectionnant un vers dans un texte partagé, en déposant un commentaire avec une mention `@nom`, en répondant depuis le compte mentionné, puis en marquant le fil comme résolu pour vérifier son masquage.

**Acceptance Scenarios**:

1. **Given** un commentateur ou co-auteur sur un texte, **When** il sélectionne une ligne ou un groupe de lignes et clique sur "Ajouter un commentaire", **Then** un encart s'ouvre ancré au passage sélectionné et son message est publié avec son nom d'artiste.
2. **Given** un fil de commentaire existant sur un vers, **When** un autre collaborateur saisit une réponse, **Then** la réponse s'insère chronologiquement dans le fil et le propriétaire du commentaire initial reçoit une notification.
3. **Given** la rédaction d'un commentaire, **When** l'auteur tape le symbole `@` suivi des premières lettres d'un collaborateur du texte, **Then** une suggestion auto-complétée de pseudonymes s'affiche et la personne choisie est explicitement mentionnée et notifiée.
4. **Given** une remarque traitée sur une rime ou une formulation, **When** un co-auteur ou le propriétaire clique sur "Résoudre", **Then** le commentaire est marqué comme résolu, masqué de la vue d'écriture principale, mais consultable dans l'historique des commentaires résolus.
5. **Given** un commentaire résolu, **When** un co-auteur clique sur "Rouvrir", **Then** le fil réapparaît en marge du texte actif.

---

### User Story 4 - Tracer les auteurs de chaque version et restaurer sans risque (Priority: P1)

En tant qu'auteur ou co-auteur d'un texte partagé, je souhaite que chaque modification enregistrée indique clairement quel artiste en est l'auteur, et que la restauration d'une version antérieure indique qui a procédé à cette opération, tout en garantissant qu'aucun conflit d'édition concurrente n'entraîne de perte de contenu.

**Why this priority**: La confiance entre collaborateurs exige une traçabilité absolue des retouches et la certitude qu'aucun couplet ou vers ne peut être écrasé par inadvertance lors de modifications croisées.

**Independent Test**: Testable de façon autonome en éditant un texte successivement avec deux comptes co-auteurs différents, en inspectant l'historique des versions pour vérifier l'attribution nominative, et en simulant une modification concurrente pour valider l'absence totale de perte.

**Acceptance Scenarios**:

1. **Given** un texte partagé édité par un co-auteur, **When** la sauvegarde automatique enregistre une révision, **Then** la version créée porte le nom d'affichage de ce co-auteur et l'horodatage précis.
2. **Given** l'historique des versions d'un texte collaboratif, **When** un co-auteur ou le propriétaire consulte les archives, **Then** chaque révision liste l'auteur correspondant, le nombre de lignes et l'extrait des changements.
3. **Given** un co-auteur consultant une version passée, **When** il choisit de "Restaurer cette version", **Then** l'état courant est préalablement sauvegardé comme nouvelle version, la révision antérieure devient le texte courant, et l'événement consigne nominativement qui a déclenché la restauration.
4. **Given** deux co-auteurs éditant simultanément le même texte en mode asynchrone ou hors ligne, **When** leurs modifications parviennent au système, **Then** aucune donnée n'est écrasée ; une version de conciliation ou une duplication protectrice est automatiquement générée avec alerte aux deux auteurs.

---

### User Story 5 - Gérer les notifications collaboratives (Priority: P1)

En tant qu'utilisateur collaborant sur plusieurs projets, je souhaite recevoir des notifications claires dans l'application et par email lors d'invitations, nouveaux commentaires, réponses et mentions, et pouvoir régler finement mes préférences de notification par type d'événement, afin de rester réactif sans être submergé.

**Why this priority**: Les alertes opportunes maintiennent le dynamisme de la collaboration artistique tout en offrant à chacun le contrôle sur son attention.

**Independent Test**: Testable indépendamment en modifiant les réglages de notifications d'un compte, en déclenchant des événements (invitation, commentaire, mention) depuis un second compte, et en observant la délivrance exacte des notifications in-app et emails selon les préférences choisies.

**Acceptance Scenarios**:

1. **Given** un utilisateur recevant une invitation ou une mention `@pseudonyme`, **When** l'événement se produit, **Then** un badge de notification apparaît en temps réel dans l'application avec un libellé clair et un lien direct vers le texte concerné.
2. **Given** un utilisateur ayant activé les notifications par email pour les invitations, **When** il est invité sur un projet, **Then** un email sobre et élégant lui est expédié contenant le nom de l'auteur, le titre du projet et un bouton pour répondre à l'invitation.
3. **Given** les paramètres de profil d'un utilisateur, **When** il désactive les notifications email pour les commentaires tout en conservant celles des mentions, **Then** les commentaires simples ne génèrent plus d'email tandis que les mentions directes continuent d'en envoyer.

---

### User Story 6 - Déclarer les crédits artistiques et exporter avec antériorité (Priority: P2)

En tant qu'auteur ou co-auteur finalisant un morceau, je souhaite renseigner les crédits de l'œuvre (auteurs des paroles, artistes invités en featuring, producteurs et compositeurs de l'instru), en précisant optionnellement une quote-part en pourcentage, et voir ces mentions figurer fidèlement sur l'export PDF officiel d'antériorité.

**Why this priority**: Le respect des droits d'auteur et la reconnaissance de chaque contributeur (rappeurs, beatmakers, compositeurs) sont capitaux dans la culture hip-hop lors de la finalisation d'un titre.

**Independent Test**: Testable isolément en ouvrant l'onglet "Crédits" d'un texte, en ajoutant deux auteurs avec 50% chacun et un beatmaker, puis en générant l'export PDF pour vérifier la présence des mentions complètes et des pourcentages.

**Acceptance Scenarios**:

1. **Given** un texte partagé, **When** un co-auteur ou le propriétaire ouvre la section "Crédits", **Then** il peut ajouter un contributeur en sélectionnant son rôle artistique (Auteur, Featuring, Beatmaker / Producteur, Compositeur).
2. **Given** la saisie des crédits, **When** l'utilisateur renseigne une part en pourcentage pour chaque auteur, **Then** le système calcule et affiche la somme totale, signalant si le cumul atteint ou dépasse 100% sans bloquer la saisie libre.
3. **Given** un texte doté de crédits renseignés, **When** l'auteur déclenche l'exportation du certificat PDF d'antériorité, **Then** le document PDF imprimé présente un cartouche dédié listant tous les intervenants, leurs qualités artistiques, leurs pourcentages respectifs et l'horodatage officiel de révision.

---

### User Story 7 - Profil auteur minimal, confidentialité et modération (Priority: P2)

En tant qu'artiste présent sur Verso, je souhaite disposer d'un profil minimal (nom d'affichage, photo/avatar optionnel, biographie courte) sans que mon adresse email ne soit jamais divulguée à quiconque sans mon accord explicite, pouvoir bloquer un utilisateur indésirable et signaler un abus, et consulter le fil d'activité récente de mes textes partagés.

**Why this priority**: La préservation de la vie privée des artistes et la protection contre le harcèlement sont des impératifs constitutionnels majeurs, indispensables pour collaborer en toute sérénité.

**Independent Test**: Testable indépendamment en consultant le profil d'un collaborateur (vérifiant l'absence d'email), en bloquant ce compte, en constatant l'interdiction immédiate de toute nouvelle invitation ou interaction, et en transmettant un signalement d'abus.

**Acceptance Scenarios**:

1. **Given** un collaborateur naviguant sur une œuvre partagée, **When** il survole ou clique sur le profil d'un autre intervenant, **Then** seuls apparaissent son nom d'affichage, son avatar et sa bio courte ; l'adresse email n'apparaît nulle part.
2. **Given** un utilisateur victime d'un comportement inapproprié ou de spam, **When** il clique sur "Bloquer cet utilisateur", **Then** l'utilisateur bloqué ne peut plus lui envoyer d'invitation, ne peut plus le mentionner, et les interactions directes sont immédiatement coupées.
3. **Given** un contenu offensant ou suspect, **When** un utilisateur utilise l'action "Signaler un abus", **Then** un formulaire succinct permet de choisir le motif et de transmettre le signalement à l'équipe de modération de manière confidentielle.
4. **Given** un texte partagé actif, **When** un collaborateur ouvre le volet "Activité récente", **Then** un journal chronologique synthétique détaille qui a modifié le texte, qui a commenté ou résolu une discussion, et à quel moment.

---

### User Story 8 - Écriture simultanée en direct et sessions studio (Priority: P3)

En tant que groupe d'auteurs réunis à distance ou en studio, nous souhaitons voir les curseurs colorés et la présence en temps réel de nos co-auteurs sur le texte, et activer un "Mode session" synchronisant la lecture de l'instrumentale et le tempo du métronome pour tous les participants connectés.

**Why this priority**: L'écriture en direct à plusieurs dans le même studio ou à distance offre une émulation créative exceptionnelle pour peaufiner des passe-passes, refrains collectifs et harmonies au rythme de la prod.

**Independent Test**: Testable en ouvrant le même texte sur deux postes connectés simultanément, en observant le déplacement des curseurs colorés lors de la frappe, et en déclenchant la lecture de l'instru sur un poste pour vérifier le démarrage synchrone sur l'autre.

**Acceptance Scenarios**:

1. **Given** deux co-auteurs connectés au même texte en direct, **When** le premier déplace son curseur ou sélectionne une strophe, **Then** le second voit instantanément le curseur coloré et le badge portant le nom du premier auteur.
2. **Given** le texte ouvert en session active, **When** les deux auteurs écrivent dans des strophes différentes, **Then** les caractères apparaissent en direct de part et d'autre avec une fluidité naturelle.
3. **Given** un texte doté d'une instrumentale audio, **When** le propriétaire ou un co-auteur lance le "Mode session studio" et appuie sur Play, **Then** l'instru démarre au même repère temporel pour tous les auditeurs connectés et le métronome bat la pulsation au même BPM.

---

### Edge Cases

- **Révocation d'accès en cours de session** : Si un collaborateur est en train de lire ou d'éditer un texte et que le propriétaire révoque son accès, sa prochaine tentative d'action ou de rafraîchissement doit immédiatement renvoyer une réponse "introuvable" (HTTP 404), sans message différencié trahissant la révocation.
- **Conflit d'édition concurrente asynchrone** : Lorsque deux co-auteurs éditent les mêmes lignes hors ligne ou sans session temps réel active, la première modification arrivée met à jour le texte courant ; la révision concurrente est automatiquement archivée comme version étiquetée « Conflit » dans l'historique partagé, déclenchant une alerte visible dans l'éditeur avec comparaison côte à côte pour conciliation sans écrasement.
- **Suppression du compte du propriétaire** : Si le créateur d'une œuvre partagée supprime son compte personnel, la propriété de l'œuvre est automatiquement transférée au co-auteur dont l'accès est le plus ancien, préservant ainsi le texte, l'historique et les collaborations actives sans rupture.
- **Suppression ou détachement d'une œuvre partagée** : Seul le propriétaire légitime peut supprimer définitivement un texte ou un album. Si un album partagé est supprimé par son propriétaire, les textes qui le composent sont simplement détachés de l'album sans être détruits, conformément aux règles fondamentales de Verso.
- **Départ ou révocation d'un collaborateur** : Lorsqu'un collaborateur quitte un projet ou que son accès est révoqué par le propriétaire, les paroles qu'il a rédigées restent intégrées au texte et à l'historique des versions, mais son accès au projet est immédiatement révoqué sans création de copie personnelle dans son espace, et ses commentaires et échanges passés sont anonymisés (mention « Ancien collaborateur ») ou purgés pour respecter la clôture de la collaboration.
- **Blocage et collaborations existantes** : Le blocage d'un utilisateur rompt immédiatement toute collaboration directe (révocation des accès accordés sur les projets du bloqueur et retrait du bloqueur des projets du bloqué) ; sur les projets d'un tiers partagés en commun, leurs interactions directes (mentions, notifications) sont mutuellement neutralisées et masquées pour préserver la sécurité de l'artiste.
- **Tentative d'invitation d'un utilisateur bloqué** : Si un utilisateur tente d'inviter une personne qu'il a bloquée ou par laquelle il est bloqué, la demande est rejetée de manière neutre sans confirmer l'existence du blocage.
- **Expiration et réutilisation d'invitation** : Un lien ou une invitation expirée ou déjà acceptée ne peut être rejouée ; elle renvoie un message neutre d'indisponibilité.
- **Neutralisation des contenus malveillants** : Tout texte collaboratif (commentaires, réponses, pseudonymes, crédits) contenant des balises ou du code exécutable doit être strictement neutralisé à l'affichage pour écarter tout risque d'injection visuelle ou applicative.
- **Gestion concurrente des instrumentales** : La suppression, la modification ou le téléversement d'une instrumentale par un co-auteur s'applique immédiatement à l'ensemble des collaborateurs du projet ; le plafond collectif strict de 3 pistes audio par texte demeure infranchissable.
- **Saturation des requêtes (Rate Limiting)** : Tout envoi massif d'invitations, de commentaires ou de recherches d'utilisateurs doit déclencher une invitation à patienter, protégeant les artistes contre le harcèlement et le spam.

---

## Requirements *(mandatory)*

### Functional Requirements

#### 1. Rôles et Autorisations Centralisées
- **FR-001**: Le système DOIT définir trois rôles collaboratifs distincts sur un texte ou un album :
  - **Co-auteur** : lecture, écriture de paroles, gestion intégrale des instrumentales audio (importation dans la limite du quota de 3 pistes, activation de la piste active, modification des métadonnées et suppression définitive), ajout/résolution de commentaires, proposition de versions, téléversement de mémos vocaux, consultation des crédits et de l'historique.
  - **Commentateur** : lecture du texte et des instrumentales, ajout de commentaires et réponses, consultation des crédits. Aucune modification directe des paroles.
  - **Lecteur** : lecture seule du texte, des instrumentales et des crédits, sans droit de commentaire ni d'édition.
- **FR-002**: Seul le propriétaire créateur de l'œuvre DOIT pouvoir inviter de nouveaux collaborateurs, modifier leurs rôles, révoquer les accès et supprimer l'œuvre.
- **FR-002a**: Lors de la suppression définitive du compte d'un propriétaire, la propriété de chaque texte partagé DOIT être automatiquement transférée au co-auteur le plus ancien sur l'œuvre, qui hérite de l'intégralité des droits d'administration ; en l'absence de tout co-auteur, l'œuvre est définitivement supprimée.
- **FR-003**: Toute décision d'accès (lecture, écriture, commentaire, partage, suppression) DOIT impérativement passer par une fonction centrale unique de contrôle d'accès, sans aucune exception ni contournement par une route ou une interface.
- **FR-004**: En cas d'accès refusé ou de ressource inexistante, le système DOIT toujours renvoyer une réponse identique "introuvable", interdisant formellement toute fuite d'information sur l'existence de l'œuvre.
- **FR-005**: Tout collaborateur (co-auteur, commentateur, lecteur) DOIT pouvoir quitter volontairement une œuvre partagée à tout moment.
- **FR-005a**: En cas de révocation d'accès ou de départ volontaire d'un collaborateur, ses paroles rédigées DOIVENT rester intégrées au texte et à l'historique des versions, son accès est immédiatement fermé sans création de copie personnelle, et l'ensemble de ses commentaires et discussions passés DOIVENT être anonymisés (mention "Ancien collaborateur") ou purgés du projet.

#### 2. Invitations et Partage Contrôlé
- **FR-006**: Les invitations DOIVENT pouvoir être adressées soit par nom d'utilisateur existant, soit par adresse email.
- **FR-007**: Les invitations DOIVENT être acceptées ou refusées de manière explicite par le destinataire avant de donner accès à l'œuvre.
- **FR-008**: Toute invitation générée DOIT comporter une date d'expiration stricte (7 jours calendaires par défaut) et demeurer révocable à tout moment par le propriétaire avant son acceptation.
- **FR-008a**: Le système DOIT limiter à un maximum de 10 collaborateurs actifs simultanés par texte partagé, afin de préserver l'ergonomie d'écriture et de prévenir les abus de masse.
- **FR-009**: Les invitations générées par lien DOIVENT reposer sur une empreinte cryptographique aléatoire sécurisée et stockée sous forme hachée, jamais en clair.
- **FR-010**: L'attribution d'un rôle sur un album DOIT accorder automatiquement ce même rôle sur l'ensemble des morceaux actuels et futurs rattachés à cet album.

#### 3. Espace "Partagés avec moi"
- **FR-011**: L'espace personnel DOIT comporter une section distincte "Partagés avec moi" regroupant les œuvres dont l'utilisateur n'est pas propriétaire mais sur lesquelles il dispose d'un rôle actif accepté.
- **FR-012**: L'espace "Partagés avec moi" DOIT permettre de filtrer les œuvres par rôle (co-auteur, commentateur, lecteur) et par artiste propriétaire.
- **FR-013**: Les œuvres partagées DOIVENT arborer un badge visuel discret indiquant le rôle détenu par l'utilisateur et le nom de l'auteur original.

#### 4. Commentaires Contextuels, Réponses et Mentions
- **FR-014**: Les utilisateurs habilités (propriétaire, co-auteur, commentateur) DOIVENT pouvoir attacher un commentaire à une ligne précise ou à une sélection contiguë de vers.
- **FR-015**: Chaque fil de commentaire DOIT permettre des réponses hiérarchisées chronologiques entre collaborateurs autorisés.
- **FR-016**: La saisie d'un commentaire DOIT supporter la mention d'un collaborateur via la syntaxe `@pseudonyme` avec autocomplétion des membres ayant accès à l'œuvre.
- **FR-017**: Le propriétaire, un co-auteur ou l'auteur du commentaire DOIT pouvoir marquer un fil de discussion comme "résolu", ce qui le masque de la vue d'écriture courante tout en le conservant consultable dans les archives des discussions.
- **FR-018**: Un fil résolu DOIT pouvoir être rouvert à tout moment par un co-auteur ou le propriétaire.
- **FR-019**: Tout contenu textuel collaboratif (commentaires, réponses, mentions) DOIT être affiché sans aucune injection de code HTML.

#### 5. Attribution des Versions, Restauration et Gestion des Conflits
- **FR-020**: Chaque révision d'un texte partagé DOIT enregistrer et afficher l'identité de son auteur réel ainsi que son horodatage exact.
- **FR-021**: L'historique des versions DOIT conserver l'intégralité des révisions de tous les co-auteurs sans limite de temps ni écrasement.
- **FR-022**: La restauration d'une version passée DOIT consigner nominativement l'auteur ayant effectué l'opération et archiver l'état courant avant d'appliquer la restauration.
- **FR-023**: En cas de modifications concurrentes asynchrones ou hors ligne, le système DOIT appliquer une stratégie de conciliation non destructive : la première modification validée devient le texte courant, tandis que la seconde est automatiquement archivée dans l'historique comme révision étiquetée « Conflit » portant le nom de son auteur, accompagnée d'un bandeau d'alerte et d'un outil de comparaison côte à côte des vers.

#### 6. Notifications In-App et Emails
- **FR-024**: Le système DOIT émettre des notifications dans l'application lors des événements suivants : réception d'une invitation, acceptation ou refus d'invitation, nouveau commentaire sur un texte, réponse à son commentaire, mention `@pseudonyme`.
- **FR-025**: Le système DOIT expédier des notifications par email lors d'une invitation ou d'une mention directe, selon les préférences de l'utilisateur.
- **FR-026**: Chaque utilisateur DOIT pouvoir configurer finement dans ses paramètres la réception de chaque type de notification (in-app et email).

#### 7. Crédits Artistiques et Antériorité
- **FR-027**: Tout texte DOIT proposer un module de crédits permettant de déclarer : les auteurs des paroles, les artistes en featuring, les beatmakers / compositeurs et les producteurs.
- **FR-028**: Les crédits d'auteurs DOIVENT permettre la mention optionnelle d'une quote-part en pourcentage pour chaque intervenant.
- **FR-029**: L'export PDF horodaté du texte DOIT intégrer la liste complète et ordonnée de ces crédits artistiques.

#### 8. Profil Minimal, Confidentialité et Modération
- **FR-030**: Le profil public visible par les autres artistes DOIT être strictement limité au nom d'affichage, à un avatar optionnel et à une courte biographie.
- **FR-031**: L'adresse email d'un utilisateur ne DOIT JAMAIS être divulguée à un autre utilisateur sans son accord exprès.
- **FR-032**: Tout utilisateur DOIT pouvoir bloquer un autre utilisateur : cela empêche immédiatement toute invitation, mention ou recherche réciproque ; révoque immédiatement l'accès du compte bloqué sur les œuvres dont le bloqueur est propriétaire ; retire immédiatement le bloqueur des œuvres dont le bloqué est propriétaire ; et neutralise mutuellement leurs mentions et notifications sur les projets communs détenus par un tiers.
- **FR-033**: Tout utilisateur DOIT pouvoir signaler un contenu ou un comportement abusif via un motif formalisé.
- **FR-034**: Le système DOIT présenter un fil d'activité récente sur chaque texte partagé résumant les actions clés (modifications, commentaires, résolutions).

#### 9. Écriture Temps Réel et Mode Session Studio (Priority: P3)
- **FR-035**: Le système DOIT afficher la présence active et les curseurs colorés distincts de chaque co-auteur connecté simultanément sur un texte.
- **FR-036**: Les modifications apportées en temps réel par un co-auteur DOIVENT se répercuter instantanément sur l'écran des autres co-auteurs sans friction de frappe.
- **FR-037**: Le système DOIT proposer un "Mode session studio" synchronisant la lecture de l'instrumentale audio et la pulsation du métronome pour l'ensemble des collaborateurs connectés à la session.

#### 10. Régulation et Protection Système
- **FR-038**: Le système DOIT appliquer une limitation de débit (rate limiting) stricte sur l'envoi d'invitations, l'émission de commentaires et les requêtes de recherche d'utilisateurs, afin de prévenir le harcèlement, le pollupostage et l'énumération de comptes.

---

### Key Entities *(include if feature involves data)*

- **CollaborationInvitation** : Représente une offre d'accès à une œuvre (texte ou album). Caractérisée par la ressource cible, l'inviteur, l'invité (par identifiant ou adresse email), le rôle proposé (co-auteur, commentateur, lecteur), le statut (en attente, acceptée, refusée, révoquée, expirée), un jeton d'invitation haché et une date d'échéance.
- **CollaboratorAccess / ResourceRole** : Lie de façon permanente un utilisateur à une œuvre avec un rôle accordé (Co-auteur, Commentateur, Lecteur) et un horodatage d'attribution.
- **InlineComment** : Commentaire ancré dans le texte. Lié à une œuvre, un auteur, une plage de lignes ou de vers, contenant le message textuel assaini, la date d'émission, l'état (ouvert ou résolu) et l'auteur de la résolution.
- **CommentReply** : Réponse chronologique à un commentaire ancré. Liée au commentaire parent, à l'auteur de la réponse, contenant le texte assaini et l'horodatage.
- **UserMention** : Référence explicite à un collaborateur au sein d'un commentaire ou d'une réponse, déclenchant une alerte ciblée.
- **SongCreditItem** : Déclaration de crédit artistique associée à une œuvre. Comprend le nom de l'artiste ou contributeur, sa fonction créative (Auteur, Featuring, Beatmaker, Compositeur), et une quote-part optionnelle en pourcentage.
- **PublicArtistProfile** : Carte de visite de l'artiste visible par les collaborateurs, composée uniquement d'un nom d'affichage, d'un visuel d'avatar et d'une courte biographie artistique (stricte absence d'email).
- **UserBlock** : Enregistrement bilatéral d'exclusion empêchant toute interaction, partage ou notification entre deux utilisateurs.
- **AbuseReport** : Signalement motivé d'abus ou de contenu inapproprié transmis à l'équipe de modération.
- **StudioSession** : Session d'écoute et d'écriture partagée en direct, coordonnant la présence des co-auteurs, la position de lecture audio et la cadence du métronome.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% des modifications apportées à un texte partagé indiquent sans ambiguïté le nom d'artiste de l'auteur dans l'historique des versions.
- **SC-002**: 100% des tentatives d'accès à un texte dont les droits sont absents, révoqués ou dont l'invitation n'a pas été acceptée renvoient une réponse identique "introuvable" (HTTP 404), sans aucune fuite d'existence.
- **SC-003**: Zéro adresse email ou donnée personnelle privée n'est exposée à un autre utilisateur dans les vues de collaboration, profils, commentaires ou historiques sans accord formel.
- **SC-004**: Zéro perte de texte lors d'éditions concurrentes ou asynchrones entre deux co-auteurs travaillant sur le même titre.
- **SC-005**: Un artiste invité peut consulter son invitation, l'accepter et ouvrir le texte partagé en moins de 15 secondes.
- **SC-006**: 100% des contenus collaboratifs (commentaires, réponses, pseudonymes, crédits) sont affichés avec neutralisation stricte de tout code ou balise HTML.
- **SC-007**: 100% des exports PDF d'antériorité générés sur un texte partagé intègrent fidèlement la liste exhaustive des crédits et attributions déclarés.
- **SC-008**: Plus de 95% des utilisateurs testés parviennent à inviter un co-auteur et à commenter une strophe sans assistance dès leur première tentative.

---

## Assumptions

- **Compte obligatoire pour collaborer** : Tous les participants à une collaboration disposent ou doivent créer un compte personnel Verso. Aucune édition anonyme sans compte n'est admise.
- **Textes privés par défaut** : Tout texte ou album créé demeure rigoureusement confidentiel et inaccessible à autrui tant qu'aucune démarche explicite d'invitation n'a été menée et acceptée.
- **Prééminence du propriétaire initial** : Le créateur d'un texte ou d'un album conserve la souveraineté sur son œuvre (gestion suprême des rôles, exclusion de membres, suppression finale de l'œuvre).
- **Modèle de résolution de conflit sans écrasement** : Conformément à la philosophie de résilience de Verso, tout conflit d'édition non synchronisé préserve les deux branches d'écriture plutôt que de privilégier arbitrairement le dernier arrivant.
- **Déploiement séquentiel par priorités** :
  - **P1** constitue le socle indispensable à livrer et stabiliser (partage, rôles, commentaires ancrés, attribution des versions, notifications, zéro perte).
  - **P2** apporte le raffinement studio, les crédits artistiques complets et la modération.
  - **P3** déploie la dimension temps réel (curseurs et session studio synchronisée).

### Périmètre Exclu (Hors Périmètre)

- **Espaces de discussion publics et forums** : Verso est un atelier d'écriture privé et intime, pas un forum ouvert.
- **Réseau social public** : Aucun fil d'actualité mondial, aucun système de followers/abonnés, aucun bouton de "like" public ou métrique de vanité.
- **Place de marché (Marketplace)** : Aucune transaction financière, vente de beats ou de textes intégrée.
- **Collaboration avec des tiers sans compte** : Seuls les utilisateurs authentifiés peuvent être co-auteurs ou commentateurs (les liens publics en lecture seule anonymes existant par ailleurs pour de la simple consultation passive).
- **Gestion juridique et contrats de droits d'auteur** : Les pourcentages de crédits n'ont qu'une valeur documentaire et déclarative pour l'antériorité, sans génération de contrats légaux automatisés.
