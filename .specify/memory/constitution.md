<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.1 → 1.1.0
Ratification Date: 2026-10-03
Last Amended Date: 2026-10-03

Modified Principles:
- II. Sécurité & Protection des Données (ajout de la gestion des liens de partage privés révocables, rate limiting sur liens publics, textes privés par défaut)
- III. Design & Expérience Utilisateur (ajout de l'exigence d'écriture ininterrompue : sauvegarde automatique, tolérance absolue aux coupures réseau)
- IV. Architecture & Gestion des Médias (renommé en "Architecture, Médias & PWA" : ajout du support PWA installable, écriture hors ligne et synchronisation)
- V. Tests & Stratégie de Livraison (recentré sur "Tests & Stratégie de Persistance")

Added Principles:
- VI. Workflow Git (Obligatoire) (règles strictes de branches, commits/push après chaque commande Spec Kit et phase d'implémentation, Conventional Commits en français)
- VII. Documentation & Handoff (Obligatoire) (mise à jour systématique de HANDOFF.md et README.md avant chaque commit, autonomie totale pour un nouvel agent, statut ✅ réservé au code implémenté et testé)

Added Sections:
- Cadre de Priorisation (P1 = socle indispensable, P2 = confort d'écriture et musique, P3 = bonus avec interdiction de transition prématurée)

Removed Sections:
- None

Follow-up TODOs:
- None (tous les principes et paramètres sont résolus et testables)
-->

# Verso Constitution

## Core Principles

### I. Qualité du Code
- **TypeScript strict intégral** : Le mode strict de TypeScript DOIT être activé sur l'ensemble du projet (frontend et backend). L'utilisation de `any` est STRICTEMENT INTERDITE sans justification explicite et documentée.
- **Simplicité et lisibilité** : Le code DOIT être simple, lisible, articulé en fonctions courtes à responsabilité unique avec des noms explicites. Toute sur-ingénierie ou abstraction prématurée est proscrite (KISS, YAGNI).
- **Validation serveur systématique** : Toutes les entrées (requêtes HTTP, corps, paramètres d'URL, formulaires) DOIVENT impérativement être validées côté serveur à l'aide de schémas Zod avant tout traitement métier.
- **Tolérance zéro sur l'outillage de qualité** : ESLint et Prettier DOIVENT être configurés et scrupuleusement respectés. Aucun avertissement (zero warning) n'est toléré lors de l'analyse statique et des contrôles de CI.
*Rationale* : Garantit la maintenabilité du code, élimine les anomalies à la compilation et assure un développement pérenne et fluide.

### II. Sécurité & Protection des Données
- **Hachage des mots de passe** : Mots de passe obligatoirement hachés avec Argon2id (avec sel cryptographique fort). Ils ne DOIVENT JAMAIS résider en clair ni apparaître dans les journaux d'événements (logs).
- **Gestion des sessions** : Sessions utilisateur persistées en base PostgreSQL, transmises via cookie `HttpOnly`, `Secure` et `SameSite=Lax`. Le stockage de tokens dans `localStorage` ou `sessionStorage` est STRICTEMENT INTERDIT.
- **Gestion des tokens** : Les tokens (vérification email, réinitialisation de mot de passe, liens de partage) DOIVENT être cryptographiquement aléatoires, hachés en base, assortis d'une expiration stricte et révocables à tout moment. Les tokens de vérification d'email DOIVENT être à usage unique.
- **Limitation de débit (Rate Limiting)** : Rate limiting OBLIGATOIRE sur toutes les routes d'authentification et sur l'accès aux liens publics / partagés.
- **Sécurité réseau et requêtes** : Protection CSRF active, en-têtes de sécurité HTTP stricts (Helmet) et CORS restrictif limitant l'accès aux seules origines autorisées.
- **OAuth** : Intégrations OAuth (Google, ORCID) exploitant obligatoirement le paramètre `state` et le protocole PKCE.
- **Confidentialité de l'authentification** : Messages d'erreur génériques interdisant formellement de révéler l'existence ou l'état d'un compte (anti-énumération d'emails).
- **Zéro secret dans le code** : Tout secret DOIT provenir de variables d'environnement. Un fichier `.env.example` complet et à jour DOIT être maintenu.
- **Isolation des données utilisateur** : Chaque utilisateur n'accède qu'à ses propres données. Chaque requête DOIT vérifier explicitement l'appartenance des ressources (prévention IDOR).
- **Textes privés par défaut & Partage contrôlé** : Tous les textes et brouillons sont STRICTEMENT PRIVÉS par défaut. Un partage n'existe que via un lien privé généré explicitement par l'auteur, strictement en lecture seule.
*Rationale* : Protège la propriété intellectuelle, les textes confidentiels et la vie privée des artistes contre toute fuite ou intrusion.

### III. Design & Expérience Utilisateur
- **Minimalisme, élégance et sobriété** : Interface épurée et raffinée, dédiée à la plume. Typographie soignée, générosité des espacements, palette de couleurs restreinte et animations discrètes.
- **Directives de conception UI** : Les règles du skill `frontend-design` DOIVENT impérativement être lues et appliquées avant toute création ou modification d'interface.
- **Thèmes et mobilité** : Mode clair et mode sombre natifs. Approche mobile-first obligatoire, garantissant une ergonomie parfaite sur smartphone en studio comme en déplacement.
- **Accessibilité** : Respect strict des normes d'accessibilité (contrastes, navigation clavier intégrale, labels explicites).
- **Continuité absolue de l'écriture** : L'acte d'écriture ne DOIT JAMAIS être interrompu. Sauvegarde automatique en temps réel, avec garantie absolue de zéro perte de texte, y compris lors d'une déconnexion réseau brutale.
*Rationale* : L'inspiration et le flow d'un rappeur ne doivent souffrir d'aucune friction cognitive ni d'aucun risque de perte de contenu.

### IV. Architecture, Médias & PWA
- **Socle technologique** : Frontend React + Tailwind CSS, backend Node.js + Prisma ORM + PostgreSQL.
- **Découplage des médias audio** : Fichiers audio (instrumentales, maquettes) hébergés hors base sur un stockage compatible S3. La base PostgreSQL ne stocke que la clé de l'objet.
- **Application installable (PWA) & Mode Hors Ligne** : L'application DOIT être une Progressive Web App (PWA) installable, supportant l'écriture hors ligne totale et la synchronisation transparente des données dès le rétablissement de la connexion.
*Rationale* : Permet aux artistes d'écrire en toute circonstance (avions, sous-sols, studios isolés sans réseau) tout en conservant une infrastructure centrale légère et performante.

### V. Tests & Stratégie de Persistance
- **Couverture de tests** : Tests unitaires obligatoires sur toute la logique métier et l'authentification. Tests d'intégration obligatoires sur l'ensemble des routes critiques.
- **Évolution de la base de données** : Migrations Prisma versionnées, reproductibles et traçables pour toute modification du schéma.
*Rationale* : Prévient les régressions fonctionnelles et sécurise la structure des données lors de chaque déploiement.

### VI. Workflow Git (Obligatoire)
- **Interdiction formelle de travailler sur `main`** : Il est STRICTEMENT INTERDIT de travailler ou de pousser directement sur `main`. Tout développement s'effectue sur `dev` ou sur une branche thématique dédiée (`feature/...`).
- **Cadence de commit et push systématique** : Un commit et un push vers le dépôt distant DOIVENT être effectués après chaque commande Spec Kit et après chaque phase d'implémentation.
- **Format et atomicité des commits** : Format Conventional Commits obligatoire en français (`feat:`, `fix:`, `docs:`, `chore:`, `test:`) avec des messages clairs. Commits petits et atomiques (une seule fonctionnalité à la fois).
- **Exclusion stricte des données sensibles** : Aucun fichier `.env`, aucun secret, aucun token ni aucun fichier audio de test ne DOIT être commité.
*Rationale* : Préserve l'intégrité de la branche de production, maintient un historique intelligible et empêche les fuites accidentelles de données.

### VII. Documentation & Handoff (Obligatoire)
- **Mise à jour documentaire systématique** : Les fichiers [HANDOFF.md](file:///home/normanxcat/Lab/verso/HANDOFF.md) et [README.md](file:///home/normanxcat/Lab/verso/README.md) DOIVENT être mis à jour après chaque commande Spec Kit et après chaque phase d'implémentation, impérativement avant le commit.
- **Autonomie de reprise (Handoff)** : `HANDOFF.md` DOIT toujours refléter l'état réel et actuel du projet de sorte qu'un nouvel agent puisse reprendre le travail en totale autonomie en le lisant seul.
- **Sécurité documentaire** : Aucune documentation ne DOIT contenir de secret, token, mot de passe ou valeur de variable d'environnement (seuls les noms des variables sont permis).
- **Véracité des statuts du README** : Une fonctionnalité ne DOIT être marquée ✅ dans le README que si et seulement si elle est effectivement implémentée et testée dans le code.
*Rationale* : Élimine la perte de contexte entre agents, fournit une visibilité exacte de l'avancement et protège les secrets du projet.

## Standards d'Ingénierie & Contraintes Techniques

- **Environnement d'exécution** : Node.js (LTS), TypeScript strict (`strict: true`, aucun `any` non documenté).
- **Frontend & PWA** : React, Tailwind CSS, Service Workers pour le cache et la synchronisation en arrière-plan, Web Storage local (IndexedDB) pour la persistance locale hors ligne des textes.
- **Backend & Données** : Node.js, Prisma ORM, PostgreSQL. Stockage compatible S3 pour les instrumentales et fichiers audio.
- **Sécurité applicative** : Validation Zod côté serveur, Argon2id pour les mots de passe, sessions PostgreSQL en cookies HttpOnly/Secure/SameSite=Lax, rate limiting sur auth et liens publics, CSRF, Helmet, CORS strict.
- **Secrets** : Fichier `.env.example` versionné, variables d'environnement pour toute clé secrète, aucun secret dans le code ni dans la documentation.

## Cadre de Priorisation & Portes de Qualité

### Grille de Priorités des Fonctionnalités
Le développement s'organise selon trois niveaux d'exigence séquentiels :
- **P1 — Socle Indispensable** : Architecture de base, authentification sécurisée (Argon2id, sessions PostgreSQL), éditeur de texte minimaliste, sauvegarde automatique résiliente, modèle de données des textes, cloisonnement des données.
- **P2 — Confort d'Écriture & Musique** : PWA installable, support complet du mode hors ligne avec synchronisation automatique, gestion et association des instrumentales et maquettes audio (stockage compatible S3), organisation avancée (albums, morceaux, couplets).
- **P3 — Partage & Bonus** : Liens de partage privés révocables en lecture seule avec rate limiting, authentification OAuth (Google, ORCID), enrichissements artistiques et options d'export.

> **Règle de transition stricte** : Il est STRICTEMENT INTERDIT d'aborder une priorité supérieure (ex: P2 ou P3) tant que la priorité précédente n'est pas intégralement développée, testée, documentée et stabilisée.

### Portes de Qualité (Quality Gates)
Chaque étape de spécification, planification et implémentation DOIT franchir successivement :
1. **Porte d'analyse statique** : Validation réussie de `eslint` et `prettier` sans aucun avertissement ni erreur tolérée. Vérification du typage TypeScript sans erreur (`tsc --noEmit`).
2. **Porte de sécurité** : Validation Zod côté serveur sur chaque route, mots de passe sous Argon2id, absence de token en `localStorage`, textes privés par défaut, et cloisonnement utilisateur strict.
3. **Porte d'expérience utilisateur & Résilience** : Respect du skill `frontend-design`, compatibilité mode clair/sombre, ergonomie mobile-first, sauvegarde automatique sans interruption de frappe même hors réseau.
4. **Porte de persistance & Tests** : Migrations Prisma versionnées, tests unitaires métier/auth validés, tests d'intégration sur routes critiques validés.
5. **Porte de livraison & Handoff** : Respect de la branche `dev`/feature, mise à jour préalable de `HANDOFF.md` et `README.md`, commit Conventional Commits en français, push sur `origin/<branche>`.

## Governance

- **Suprématie constitutionnelle** : La présente constitution prévaut sur toute documentation informelle ou habitude de développement. Tout code non conforme aux principes non négociables DOIT être refusé ou refactorisé.
- **Dérogations exceptionnelles** : Toute dérogation ponctuelle DOIT être documentée, justifiée techniquement et explicitement validée.
- **Procédure d'amendement** : Toute modification de cette constitution nécessite la formalisation d'une proposition, une justification rigoureuse et une incrémentation de version selon SemVer :
  - **MAJOR** : Suppression, affaiblissement ou refonte d'un principe non négociable ou de l'architecture centrale.
  - **MINOR** : Ajout d'un nouveau principe, d'une nouvelle section ou d'une directive d'ingénierie enrichissant la gouvernance sans casser les acquis.
  - **PATCH** : Clarification de formulation, correction typographique ou ajustement mineur sans impact sémantique.
- **Audit de conformité** : Chaque cycle de spécification (`speckit-specify`), de planification (`speckit-plan`) et d'implémentation (`speckit-implement`) DOIT systématiquement vérifier sa conformité avec les articles de cette constitution.

**Version**: 1.1.0 | **Ratified**: 2026-10-03 | **Last Amended**: 2026-10-03
