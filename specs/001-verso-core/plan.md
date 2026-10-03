# Implementation Plan: Verso Core Platform

**Branch**: `dev` | **Date**: 2026-10-03 | **Spec**: [specs/001-verso-core/spec.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/spec.md)

**Input**: Spécification fonctionnelle complète de la plateforme Verso ([specs/001-verso-core/spec.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/spec.md)) et arbitrages issus de `/speckit-clarify`.

---

## Summary

La plateforme **Verso** est développée sous la forme d'un monorepo TypeScript (`apps/web`, `apps/api`, `packages/shared`). L'architecture privilégie la réactivité extrême de l'écriture rap (zéro latence, sauvegarde continue < 500 ms, résilience hors ligne via PWA et IndexedDB), une sécurité hermétique (mots de passe Argon2id, sessions en base PostgreSQL via cookies sécurisés, CSRF, rate limiting, protection des rimes par défaut), une gestion des instrumentales audio déportée sur stockage compatible S3 (URLs présignées PUT/GET, limite de 75 Mo et jusqu'à 3 pistes par texte), et un moteur d'analyse métrique en français (syllabes et rimes).

---

## Technical Context

**Language/Version**: TypeScript 5.5+ en mode strict intégral (`"strict": true`, `"noImplicitAny": true`).

**Primary Dependencies**:
- *Backend* : Node.js (LTS v20+), Fastify v4+, `@node-rs/argon2`, `arctic` (OAuth avec PKCE), `@fastify/rate-limit`, `@fastify/cookie`, `@fastify/csrf-protection`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `pdfkit`.
- *Frontend* : React 18+, Vite 5+, Tailwind CSS 3+, React Router v6+, TanStack Query v5+, React Hook Form avec `@hookform/resolvers/zod`, CodeMirror 6 (éditeur poétique réactif), `@dnd-kit/core` & `@dnd-kit/sortable` (glisser-déposer d'album), `vite-plugin-pwa` & `idb` (mode hors ligne et persistance locale).
- *Partagé* : Zod v3+ (validation stricte et inférence de types).

**Storage**:
- PostgreSQL 16 accédé via Prisma ORM v5+ avec migrations versionnées.
- Stockage d'objets compatible S3 (MinIO en développement local, Cloudflare R2 / AWS S3 en production).
- IndexedDB côté navigateur pour le cache local, l'écriture hors ligne et la file de synchronisation.

**Testing**: Vitest sur l'ensemble du monorepo, Fastify `inject` / Supertest pour les routes d'API, React Testing Library pour les composants frontend.

**Target Platform**: Navigateurs modernes (Desktop & Mobile-first), Progressive Web App (PWA) installable, conteneurs Docker pour services locaux.

**Project Type**: Application web modulaire en monorepo (`apps/web`, `apps/api`, `packages/shared`).

**Performance Goals**:
- Sauvegarde continue silencieuse en arrière-plan sous 500 ms après la frappe.
- Recherche instantanée plein texte dans les paroles et filtres sous 200 ms.
- Zéro perte de texte (100% de résilience lors des coupures réseau).

**Constraints**:
- Respect absolu de la politique zéro warning (ESLint et Prettier).
- Zéro `any` dans le code sans justification explicite.
- Aucun jeton ni secret dans `localStorage` (cookies `HttpOnly`, `Secure`, `SameSite=Lax` obligatoires).
- Fichiers audio limités à 75 Mo et hébergés hors base relationnelle.

**Scale/Scope**:
- P1 (Socle indispensable) : Authentification, Espace personnel, Éditeur de texte résilient, Gestion d'albums.
- P2 (Confort & Musique) : Historique illimité des versions, Métrique et rimes, Instrus S3 et lecteur avec boucle, Export PDF, Partage privé.
- P3 (Bonus) : PWA hors ligne intégrale avec synchronisation, Freestyle vocal, Dictionnaire de rimes.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Qualité du code** : ✅ CONFORME. TypeScript strict configuré sur tous les modules, Zod côté serveur obligatoire, ESLint/Prettier configurés en zéro warning.
- **Sécurité & Données** : ✅ CONFORME. Mots de passe Argon2id, sessions en base PostgreSQL, cookies sécurisés, tokens d'email à usage unique, rate limiting sur auth et liens de partage, liaison OAuth confirmée par mot de passe, textes privés par défaut.
- **Design & UX** : ✅ CONFORME. Directives du skill `frontend-design` appliquées, mode sombre/clair natif, mobile-first, accessibilité, écriture continue sans interruption.
- **Architecture & Médias** : ✅ CONFORME. Stack React + Fastify + Prisma + PostgreSQL, fichiers audio hébergés hors base sur compatible S3 (MinIO/R2), PWA installable avec support hors ligne.
- **Tests & Livraison** : ✅ CONFORME. Vitest sur logique métier et routes d'API critiques, migrations Prisma versionnées.
- **Workflow Git & Documentation** : ✅ CONFORME. Branche `dev`, commits Conventional Commits en français, push systématique, `HANDOFF.md` et `README.md` tenus à jour à chaque étape.

---

## Project Structure

### Documentation (cette fonctionnalité)

```text
specs/001-verso-core/
├── spec.md              # Spécification fonctionnelle validée et clarifiée
├── checklists/
│   └── requirements.md  # Checklist qualité (16/16 critères validés)
├── plan.md              # Ce document (plan d'implémentation technique)
├── research.md          # Décisions d'architecture et technologies validées (Phase 0)
├── data-model.md        # Schéma relationnel Prisma et entités détaillées (Phase 1)
├── contracts/           # Contrats d'API REST Zod détaillés (Phase 1)
│   ├── auth-api.md      # Authentification, sessions, emails et OAuth
│   ├── songs-api.md     # Textes, versions, PDF et partages privés
│   ├── albums-api.md    # Albums et ordonnancement de tracklist
│   └── audio-api.md     # Instrumentales S3, BPM, boucles et mémos vocaux
└── quickstart.md        # Guide des scénarios exécutables de validation bout en bout (Phase 1)
```

### Source Code (arborescence cible du monorepo)

```text
verso/
├── apps/
│   ├── api/                           # Backend Fastify + Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # Schéma de base de données PostgreSQL
│   │   │   └── migrations/            # Migrations versionnées
│   │   ├── src/
│   │   │   ├── config/                # Validation Zod des variables d'environnement
│   │   │   ├── plugins/               # Fastify plugins (auth, session, rate-limit, s3, cors, csrf)
│   │   │   ├── modules/
│   │   │   │   ├── auth/              # Contrôleurs, services et routes d'authentification
│   │   │   │   ├── songs/             # Gestion des textes, versions et export PDF
│   │   │   │   ├── albums/            # Gestion des albums et réordonnancement
│   │   │   │   └── audio/             # Intégration S3 (URLs présignées) et mémos
│   │   │   ├── app.ts                 # Enregistrement des plugins et routes
│   │   │   └── server.ts              # Démarrage du serveur HTTP
│   │   ├── tests/
│   │   │   ├── integration/           # Tests des routes critiques
│   │   │   └── unit/                  # Tests unitaires des services métier
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                           # Frontend React + Vite + Tailwind + PWA
│       ├── public/                    # Manifest PWA, icônes, assets statiques
│       ├── src/
│       │   ├── assets/
│       │   ├── components/
│       │   │   ├── common/            # Boutons, modales, bannières (avertissement email)
│       │   │   ├── editor/            # Éditeur CodeMirror, gutter syllabes, coloration rimes
│       │   │   ├── audio/             # Lecteur instru, contrôleur de boucle, métronome
│       │   │   └── album/             # Tracklist avec dnd-kit pour glisser-déposer
│       │   ├── hooks/                 # useAutoSave, useAudioPlayer, useOfflineSync
│       │   ├── lib/                   # Client API (fetcher typé), IndexedDB (idb)
│       │   ├── pages/                 # Écrans (Login, Register, Dashboard, Editor, AlbumView)
│       │   ├── App.tsx                # Routage et providers (TanStack Query, ThemeProvider)
│       │   └── main.tsx
│       ├── tests/                     # Tests de composants et hooks
│       ├── package.json
│       ├── vite.config.ts             # Configuration Vite et vite-plugin-pwa
│       └── tsconfig.json
│
├── packages/
│   └── shared/                        # Code et logique partagés
│       ├── src/
│       │   ├── schemas/               # Schémas Zod partagés (auth, song, album, audio)
│       │   ├── types/                 # Types TypeScript inférés
│       │   └── lyrics-engine/         # Calculateur de syllabes et détecteur de rimes françaises
│       ├── tests/                     # Tests unitaires du moteur métrique poétique
│       ├── package.json
│       └── tsconfig.json
│
├── docker-compose.yml                 # Services locaux (PostgreSQL 16, MinIO)
├── .gitignore                         # Blocage strict .env, secrets, audio de test
├── HANDOFF.md                         # Suivi de passation permanent
├── README.md                          # Documentation et règles du projet
└── package.json                       # Racine du monorepo pnpm/npm
```

---

## Complexity Tracking

> **Aucune violation constitutionnelle détectée**. Tous les choix d'architecture (monorepo 2 apps + 1 shared, Fastify, CodeMirror, Prisma, stockage objet S3, sessions en base avec cookie HttpOnly) répondent strictement aux exigences non négociables de sécurité, de performance et de résilience sans sur-ingénierie.
