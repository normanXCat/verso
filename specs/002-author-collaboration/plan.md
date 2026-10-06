# Implementation Plan: Collaboration entre Auteurs (Author Collaboration)

**Branch**: `002-author-collaboration` | **Date**: 2026-10-06 | **Spec**: [specs/002-author-collaboration/spec.md](file:///home/normanxcat/Lab/verso/specs/002-author-collaboration/spec.md)

**Input**: Feature specification from `/specs/002-author-collaboration/spec.md`

---

## Summary

Permettre aux artistes et rappeurs de collaborer en toute confiance sur leurs textes et albums au sein de Verso, selon trois paliers séquentiels d'exigence :
- **P1 (Partage, Rôles & Commentaires)** : Modèle d'accès unifié (`CO_AUTHOR`, `COMMENTER`, `READER`) encadré par une fonction d'autorisation centrale unique `can()`, invitations par token haché, espace personnel « Partagés avec moi », commentaires ancrés par vers avec mentions et résolution, attribution nominative des versions et résolution non destructive des conflits asynchrones par verrouillage optimiste (`revision`).
- **P2 (Crédits, Profils & Modération)** : Déclaration des quotes-parts artistiques avec export PDF d'antériorité fidèle, profils auteurs préservant l'anonymat de l'adresse email, blocage bilatéral d'utilisateurs avec rupture d'accès immédiate, signalement d'abus et fil d'activité récente.
- **P3 (Temps Réel & Studio)** : Écriture simultanée assistée par CRDT Yjs avec curseurs et présence colorés dans CodeMirror 6, complétée par un mode « session studio » synchronisant la lecture de l'instrumentale Web Audio et du métronome.

---

## Technical Context

**Language/Version**: TypeScript 5.4+ (mode strict intégral, aucun `any` non documenté) sur Node.js 20 LTS.

**Primary Dependencies**:
- *Backend* : Fastify v4+, Prisma ORM v5+, Zod (validation des schémas), `@fastify/rate-limit`, `@fastify/websocket` (phase P3), `pdfkit` (génération PDF), `resend` (emails transactionnels groupés).
- *Frontend* : React 18, Tailwind CSS, CodeMirror 6, `@y-rb/y-codemirror` / `y-codemirror.next` (phase P3), TanStack Query, Framer Motion, `idb` (IndexedDB offline storage).
- *Partagé* : `@verso/shared` pour les schémas Zod, énumérations et types communs.

**Storage**:
- PostgreSQL 16 (persistance relationnelle via Prisma).
- Stockage compatible S3 (MinIO en local, Cloudflare R2 en production) pour les instrumentales et mémos vocaux.
- IndexedDB local côté client (persistance locale et mode hors ligne via Service Worker).

**Testing**: Vitest (tests unitaires et d'intégration séquentiels avec base PostgreSQL dédiée), React Testing Library + `jsdom` pour les composants frontend.

**Target Platform**: Navigateurs modernes (Desktop & Mobile-first), Progressive Web App installable.

**Project Type**: Monorepo TypeScript web application (`apps/web`, `apps/api`, `packages/shared`).

**Performance Goals**:
- Contrôle d'accès `can()` évalué en `< 10 ms` (requêtes indexées en base).
- Réception des alertes in-app via SSE en `< 500 ms`.
- Frappe fluide dans CodeMirror 6 sans aucune saccade lors du recalcul des métriques ou des deltas temps réel.

**Constraints**:
- **Zéro fuite d'existence** : Toute ressource inaccessible ou interdite DOIT lever un `404 Not Found` identique à une ressource inexistante.
- **Zéro fuite d'adresse email** : Aucun profil ni endpoint de recherche ne doit révéler l'adresse email d'un tiers sans son accord formel.
- **Zéro perte de contenu** : Aucun conflit de sauvegarde asynchrone ne doit écraser les vers d'un co-auteur.
- **Neutralisation XSS stricte** : Aucun contenu collaboratif (commentaires, noms) ne doit être injecté en HTML brut.

**Scale/Scope**: Jusqu'à 10 collaborateurs actifs par texte, jusqu'à 3 pistes d'instrumentales audio par texte, rate limiting de 10 à 30 req/min sur les actions sensibles.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe Constitutionnel | Exigence Clé | Statut de Conformité | Justification Architecturale |
| :--- | :--- | :---: | :--- |
| **I. Qualité du Code** | TS strict, schémas Zod serveur, ESLint/Prettier 0 warning. | ✅ Validé | Schémas Zod partagés (`@verso/shared`) sur toutes les routes d'invitations, commentaires, crédits et modération. |
| **II. Sécurité & Autorisations** | Fonction centrale `can()`, anti-fuite 404, rate limiting étendu, tokens hachés, vie privée (anti-fuite email), neutralisation XSS. | ✅ Validé | Module `permissions.service.ts` unique appelé sur 100% des routes ; réponse 404 uniforme ; tokens d'invitation SHA-256 avec expiration 7 jours ; rate limiting dédié ; affichage assaini. |
| **III. Design & Expérience Utilisateur** | Encre & Papier, respect du skill `frontend-design`, sauvegarde automatique sans interruption. | ✅ Validé | Composants de collaboration (panneau d'invitations, tiroir de commentaires, modale de crédits) conçus selon les jetons Encre & Papier, sans interruption de frappe. |
| **IV. Architecture & PWA** | Monorepo Fastify + React, écriture hors ligne préservée. | ✅ Validé | Compatibilité totale de la persistance locale IndexedDB avec la détection de conflit P1 et la synchronisation P3. |
| **V. Tests & Persistance** | Tests exhaustifs de `can()`, tests unitaires métier et d'intégration, migrations Prisma versionnées. | ✅ Validé | Suite de tests dédiée `can.test.ts` couvrant 100% de la matrice Rôle × Ressource × Action, migrations Prisma versionnées. |
| **VI. Workflow Git** | Branche `dev`/feature, commits atomiques en français, pas de push direct sur `main`. | ✅ Validé | Branche de feature `002-author-collaboration`, cadence de commit et push systématique. |
| **VII. Documentation & Handoff** | `HANDOFF.md` et `README.md` synchronisés avant chaque commit. | ✅ Validé | Tenue à jour permanente de l'état du projet et de la feuille de route. |

---

## Project Structure

### Documentation (this feature)

```text
specs/002-author-collaboration/
├── spec.md                  # Spécification fonctionnelle validée et clarifiée (5 Q/R)
├── plan.md                  # Ce document d'implémentation technique (/speckit-plan)
├── research.md              # Décisions techniques d'architecture consolidées (Phase 0)
├── data-model.md            # Modèle relationnel Prisma complet (Phase 1)
├── quickstart.md            # Scénarios de validation exécutables de bout en bout (Phase 1)
├── contracts/               # Contrats d'interfaces et d'API REST / WebSocket (Phase 1)
│   ├── collaboration-api.md # Invitations, gestion des accès et espace partagé
│   ├── comments-api.md      # Commentaires ancrés, réponses, mentions et résolution
│   ├── credits-api.md       # Déclaration des crédits et quote-part pour export PDF
│   ├── moderation-api.md    # Recherche protégée, blocage mutuel et signalement d'abus
│   ├── notifications-api.md # Alertes in-app, flux temps réel SSE et préférences
│   └── realtime-protocol.md # Protocole WebSocket Yjs P3 et synchronisation audio
└── checklists/
    └── requirements.md      # Checklist qualité validée à 100% (16/16)
```

### Source Code (repository root layout)

```text
packages/shared/src/
├── schemas/
│   ├── collaboration.ts     # Schémas Zod invitations, rôles, filtres partagés
│   ├── comment.ts           # Schémas Zod commentaires ancrés et réponses
│   ├── credit.ts            # Schémas Zod déclarations de crédits artistiques
│   ├── moderation.ts        # Schémas Zod blocage, recherche d'utilisateurs, signalements
│   └── notification.ts      # Schémas Zod notifications et préférences
└── types/
    └── collaboration.ts     # Interfaces TypeScript partagées

apps/api/
├── prisma/
│   └── schema.prisma        # Extension du schéma Prisma (Collaborator, Invitation, Comment, etc.)
└── src/
    ├── modules/
    │   ├── permissions/     # MODULE CENTRAL UNIQUE D'AUTORISATION
    │   │   ├── permissions.service.ts # Implémentation stricte de can(user, resource, action)
    │   │   └── permissions.types.ts   # Définition des cibles et actions
    │   ├── collaboration/   # Gestion des invitations et accès
    │   │   ├── collaboration.repository.ts
    │   │   ├── collaboration.service.ts
    │   │   └── collaboration.routes.ts
    │   ├── comments/        # Commentaires et discussions ancrées
    │   │   ├── comments.repository.ts
    │   │   ├── comments.service.ts
    │   │   └── comments.routes.ts
    │   ├── credits/         # Crédits artistiques et injection PDF
    │   │   ├── credits.service.ts
    │   │   └── credits.routes.ts
    │   ├── moderation/      # Blocage, recherche protégée et signalements
    │   │   ├── moderation.service.ts
    │   │   └── moderation.routes.ts
    │   └── notifications/   # File d'alertes, emails groupés et SSE
    │       ├── notifications.service.ts
    │       ├── notifications.sse.ts
    │       └── notifications.routes.ts
    └── tests/
        ├── unit/
        │   └── permissions.test.ts    # Tests unitaires exhaustifs de can() (100% couverture)
        └── integration/
            ├── collaboration.test.ts  # Tests d'intégration cycle d'invitation et accès
            ├── comments.test.ts       # Tests d'intégration commentaires et mentions
            ├── conflict.test.ts       # Tests d'intégration détection et conciliation 409
            ├── credits.test.ts        # Tests d'intégration crédits et export PDF
            └── moderation.test.ts     # Tests d'intégration blocage et anti-énumération

apps/web/src/
├── components/
│   ├── collaboration/       # UI de collaboration
│   │   ├── CollaboratorsModal.tsx   # Gestion des accès et invitations
│   │   ├── InviteCollaboratorForm.tsx
│   │   └── SharedBadge.tsx
│   ├── comments/            # UI des discussions ancrées
│   │   ├── CommentThreadDrawer.tsx
│   │   ├── InlineCommentMarker.tsx
│   │   └── CommentComposer.tsx
│   ├── credits/             # UI des crédits artistiques
│   │   └── CreditsEditorModal.tsx
│   └── moderation/          # UI de blocage et signalement
│       └── BlockUserModal.tsx
├── pages/
│   ├── SharedWithMePage.tsx # Onglet "Partagés avec moi" du tableau de bord
│   └── InvitationsPage.tsx  # Page d'acceptation d'invitations
└── lib/
    ├── collaboration-client.ts
    ├── comments-client.ts
    └── notifications-stream.ts # Client EventSource pour SSE
```

**Structure Decision**: Monorepo standardisé conservant le découpage clair entre logique partagée (`@verso/shared`), backend d'autorisations et d'API (`apps/api`), et interface utilisateur React (`apps/web`). Le module `permissions` est placé en première ligne comme composant transverse indispensable.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*(Aucune violation constitutionnelle constatée : l'architecture respecte intégralement tous les principes et exigences de la Constitution v2.0.0).*
