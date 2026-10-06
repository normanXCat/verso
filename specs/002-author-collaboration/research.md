# Research: Architecture Technique de la Collaboration entre Auteurs

Ce document consigne les recherches, comparaisons et choix techniques validés pour la fonctionnalité **Collaboration entre Auteurs** de la plateforme **Verso**, conformément à la [Constitution v2.0.0](file:///home/normanxcat/Lab/verso/.specify/memory/constitution.md) et aux spécifications fonctionnelles de [`specs/002-author-collaboration/spec.md`](file:///home/normanxcat/Lab/verso/specs/002-author-collaboration/spec.md).

---

## 1. Module d'Autorisations Centralisé (`permissions` & fonction `can`)

### Decision
Implémenter un module dédié unique `permissions.service.ts` au sein de `apps/api/src/modules/permissions/` exportant une fonction centrale unique :
```typescript
export async function can(
  user: AuthenticatedUser | null,
  resource: ResourceTarget,
  action: ActionType
): Promise<boolean>
```
où :
- `resource` est typé par une union discriminée `{ type: 'song', songId: string } | { type: 'album', albumId: string } | { type: 'comment', commentId: string } | { type: 'invitation', invitationId: string } | { type: 'user', targetUserId: string }`.
- `action` est typée selon l'entité (`read`, `write`, `comment`, `delete`, `share`, `invite`, `manage_roles`, `manage_audio`, `export_pdf`, etc.).
- La fonction vérifie :
  1. Si l'utilisateur est le propriétaire légitime (droits complets).
  2. Si l'utilisateur possède une entrée active dans `Collaborator` (rôle `CO_AUTHOR`, `COMMENTER` ou `READER`) directement sur le texte ou héritée par l'album parent.
  3. Si un enregistrement de blocage mutuel (`UserBlock`) existe entre les deux utilisateurs (qui neutralise ou interdit l'action).
- **Règle absolue d'anti-fuite 404** : Lorsque `can()` renvoie `false` lors d'une requête sur une ressource ciblée, la route Fastify DOIT systématiquement lever une erreur `404 Not Found` (avec message neutre "Ressource introuvable"), identique au cas où la ressource n'existe pas en base.

### Rationale
- **Exigence constitutionnelle non négociable** (Constitution v2.0.0, Principe II) : *« Toute décision d'accès passe par une fonction centrale unique (...) Aucune route ni aucun composant ne contourne cette fonction. »*
- Centraliser les règles de permissions évite la dispersion des requêtes `where: { userId }` dans chaque contrôleur et élimine les vulnérabilités de type BOLA / IDOR.
- Permet de tester exhaustivement la matrice complète des droits (100% de couverture unitaire sur les combinaisons Rôle × Ressource × Action).

### Alternatives Considered
- *Autorisations ad hoc décentralisées dans chaque repository / service* : Rejeté. Source majeure d'incohérence, d'omissions de vérification et de failles IDOR. Viole directement la constitution.
- *Bibliothèques complexes externes (Casbin, Cerbos, OPA)* : Rejeté. Sur-ingénierie manifeste (KISS / YAGNI) pour un modèle à 3 rôles hiérarchiques et un propriétaire. Une fonction TypeScript pure et typée est plus performante, explicite et facile à auditer.

---

## 2. Détection et Gestion des Conflits d'Édition Asynchrone (P1)

### Decision
Mettre en place un mécanisme de verrouillage optimiste basé sur un numéro de révision (`revision: Int`, initialisé à 1) sur le modèle `Song` :
1. Le client charge le texte avec sa `revision` courante.
2. Lors de la sauvegarde automatique debouncée (< 500 ms) ou manuelle (`PATCH /api/songs/:id`), le corps de requête transmet `expectedRevision`.
3. Le backend compare `expectedRevision` avec la révision en base :
   - **Si égalité** : la mise à jour est acceptée dans une transaction Prisma, `revision` est incrémentée (`revision + 1`), et une `SongVersion` avec `authorId` est enregistrée.
   - **Si divergence (`currentRevision !== expectedRevision`)** : le serveur refuse l'écrasement en renvoyant un statut `409 Conflict`. La transaction archive la modification soumise en tant que `SongVersion` spéciale étiquetée `isConflict: true` rattachée à l'auteur en conflit, sans écraser le texte courant.
4. Le frontend reçoit le `409 Conflict` avec les paroles courantes du serveur et ouvre un volet de conciliation côte à côte permettant à l'auteur d'intégrer ses vers sans aucune perte de frappe.

### Rationale
- Respecte le mandat fonctionnel et constitutionnel : **zéro perte de texte** lors d'écritures concurrentes.
- Fonctionne parfaitement en mode asynchrone, en cas de latence réseau et avec la persistance locale IndexedDB / PWA de Verso.
- Ne bloque jamais brutalement l'utilisateur : le travail de chaque auteur est sauvegardé en base dans l'historique d'antériorité.

### Alternatives Considered
- *Last-Write-Wins (écrasement silencieux par le dernier arrivant)* : Rejeté catégoriquement. Provoque des pertes irréversibles de rimes et de couplets.
- *Verrouillage pessimiste (lock de 5 minutes par auteur)* : Rejeté. Dégrade sévèrement l'expérience utilisateur, particulièrement en cas de coupure réseau où le texte resterait bloqué.
- *Diff3 / Fusion textuelle automatique aveugle* : Rejeté pour la phase P1. La poésie et la métrique du rap ne s'accommodent pas de fusions algorithmiques aléatoires de lignes ; l'arbitrage humain assisté par comparaison est indispensable.

---

## 3. Collaboration Temps Réel en Phase P3 (Yjs & WebSockets)

### Decision
Pour la phase P3 (écriture simultanée et session studio), adopter la pile **Yjs (CRDT)** avec serveur WebSocket Fastify :
1. **Moteur CRDT** : `yjs` côté serveur et frontend.
2. **Couche réseau** : Plugin `@fastify/websocket` couplé au protocole `y-protocols/awareness` et `y-protocols/sync`. Le serveur WebSocket authentifie la connexion via le cookie de session PostgreSQL existant (`Session` validée) et vérifie les droits `can(user, song, 'write')`.
3. **Éditeur** : CodeMirror 6 (actuellement en place dans Verso) intégré nativement via `@y-rb/y-codemirror` ou `y-codemirror.next`, affichant les curseurs colorés et les pseudonymes des co-auteurs en direct.
4. **Persistance en base** : Stockage du document binaire CRDT (`Uint8Array`) dans un champ dédié de la base, avec projection périodique (debounce 2s) dans la colonne textuelle `Song.lyrics`.
5. **Session studio audio** : Un canal de broadcast d'état de transport audio (`isPlaying`, `positionMs`, `bpm`, `timestamp`) partagé entre les clients connectés pour synchroniser le métronome et l'instru Web Audio.
6. **Résilience hors ligne** : Le client bascule de manière transparente sur `offline-storage.ts` (IndexedDB) en cas de déconnexion réseau, et synchronise les deltas Yjs dès le retour de la connexion.

### Rationale
- Yjs est la référence industrielle pour la collaboration de texte (performances exceptionnelles, faible empreinte mémoire, résolution mathématique des conflits via CRDT).
- CodeMirror 6 dispose d'un binding Yjs officiel mature sans nécessiter de refonte d'éditeur.
- Le découplage permet de livrer P1 et P2 de façon parfaitement autonome et robuste, tout en garantissant que l'architecture technique de P3 s'intègre naturellement sans casser la persistance.

### Alternatives Considered
- *Operational Transformation (ShareDB / OT)* : Rejeté. Nécessite un serveur central monolithique complexe gérant chaque opération atomique, difficilement compatible avec le mode hors ligne PWA.
- *TipTap / ProseMirror* : Rejeté. Verso a déjà investi avec succès dans CodeMirror 6 avec des extensions sur mesure (comptage de syllabes poétiques et coloration des rimes françaises). Remplacer l'éditeur introduirait une régression majeure.

---

## 4. Notifications : File en Base, Envois Groupés & Server-Sent Events

### Decision
1. **Stockage & Persistance** : Table PostgreSQL `Notification` enregistrant chaque événement (`INVITATION_RECEIVED`, `INVITATION_ACCEPTED`, `COMMENT_ADDED`, `COMMENT_REPLY`, `MENTION`).
2. **Diffusion In-App Temps Réel** : Route SSE (Server-Sent Events) `GET /api/notifications/stream` protégée par cookie de session. Dès qu'un événement survient, l'API émet un événement JSON léger au client connecté, incrémentant le badge de notifications sans polling agressif.
3. **Emails Transactionnels Groupés (Anti-Spam)** :
   - Les invitations et mentions directes génèrent un email immédiat (si activé par le destinataire).
   - Les commentaires et réponses rapprochés sont mis en file d'attente avec une fenêtre de regroupement (batching debounce de 3 minutes). Si plusieurs commentaires interviennent dans ce délai sur le même texte, un seul email récapitulatif élégant ("3 nouveaux commentaires sur votre texte [Titre]") est expédié via Resend.
   - Respect strict des préférences utilisateur stockées en base (`NotificationSettings`).

### Rationale
- SSE est natif HTTP/1.1 et HTTP/2, unidirectionnel, résilient aux reconnexions automatiques du navigateur, et consomme beaucoup moins de ressources serveur qu'un polling régulier ou qu'un socket bidirectionnel dédié aux alertes.
- Le regroupement des emails protège la boîte de réception des artistes en studio contre le harcèlement de notifications lors d'échanges vifs.

### Alternatives Considered
- *Polling HTTP régulier (`GET /api/notifications` toutes les 5s)* : Rejeté. Génère une charge serveur inutile et une latence désagréable.
- *WebSockets pour les notifications simples* : Rejeté pour P1/P2. SSE est plus simple, standardisé sur Fastify et passe sans accroc tous les proxys et pare-feux HTTP.

---

## 5. Recherche Sécurisée d'Utilisateurs & Prévention de l'Énumération

### Decision
1. **Endpoint de recherche strict** : `GET /api/users/search?q=...`
2. **Critère de recherche** :
   - Recherche exacte uniquement : égalité stricte insensible à la casse sur `username` (`WHERE LOWER(username) = LOWER(:q)`) OU sur `email` (`WHERE LOWER(email) = LOWER(:q)`).
   - Aucune recherche partielle par préfixe (`contains`, `startsWith` ou wildcard `%`) n'est autorisée.
   - Longueur minimale de la requête : 3 caractères.
3. **Confidentialité absolue des données retournées** :
   - Réponse limitée aux informations publiques consenties : `{ id: string, username: string, displayName: string, avatarUrl: string | null }`.
   - **L'adresse email n'est JAMAIS renvoyée dans la réponse JSON**, même si la recherche a été effectuée par email.
4. **Vérification de blocage bilatéral** : Si l'utilisateur demandeur a bloqué la cible ou a été bloqué par elle, la recherche renvoie un tableau vide (`[]`).
5. **Rate Limiting renforcé** : Limite stricte de 10 requêtes par minute par utilisateur authentifié via `@fastify/rate-limit`, empêchant toute tentative de scraping ou d'énumération par dictionnaire.

### Rationale
- **Mandat constitutionnel de protection de la vie privée** : interdiction formelle d'exposer l'email des rappeurs et artistes.
- Bloque définitivement les attaques par énumération de comptes tout en permettant d'inviter facilement un collaborateur dont on connaît le blaze ou l'adresse.

---

## 6. Synthèse des Décisions Techniques

| Domaine | Solution Validée | Justification Principale |
| :--- | :--- | :--- |
| **Autorisations** | Module unique `permissions` avec `can()` | Exigence constitutionnelle, prévention IDOR, tests exhaustifs. |
| **Gestion des erreurs d'accès** | `404 Not Found` uniforme | Anti-fuite d'existence absolue. |
| **Conflits P1** | Numéro de `revision` + version `isConflict` | Zéro perte de texte, non bloquant, conciliation guidée. |
| **Temps réel P3** | Yjs + `@fastify/websocket` + CodeMirror 6 | CRDT robuste, bindings existants, audio partagé synchrone. |
| **Notifications in-app** | Server-Sent Events (SSE) | Léger, standard, reprise réseau automatique, zéro dépendance. |
| **Notifications email** | Regroupement par lot (debounce 3 min) | Prévention du spam lors des sessions d'écriture denses. |
| **Recherche d'utilisateurs** | Égalité exacte + zéro fuite d'email + rate limit | Anti-énumération, respect strict de la vie privée. |
