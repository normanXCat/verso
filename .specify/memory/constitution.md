<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.0.1
Ratification Date: 2026-10-03
Last Amended Date: 2026-10-03

Modified Principles:
- V. Tests & Stratégie de Livraison (précision des règles Git obligatoires : interdiction de main, branche dev/feature, Conventional Commits en français, exclusion stricte .env/secrets/audio, git push -u origin <branche>)

Added Sections:
- None

Removed Sections:
- None

Follow-up TODOs:
- None
-->

# Verso Constitution

## Core Principles

### I. Qualité du Code
- **TypeScript strict intégral** : Le mode strict de TypeScript DOIT être activé sur l'intégralité du projet (frontend et backend). L'usage de `any` est STRICTEMENT INTERDIT, sauf cas d'exception tiers explicitement motivé et documenté.
- **Simplicité et lisibilité** : Le code DOIT demeurer simple, concis et lisible. Les fonctions DOIVENT être courtes, à responsabilité unique, avec des identifiants explicites. Toute sur-ingénierie et abstraction prématurée sont proscrites (KISS, YAGNI).
- **Validation serveur systématique** : Toutes les entrées (requêtes HTTP, corps de requêtes, paramètres d'URL, formulaires) DOIVENT obligatoirement être validées côté serveur avec Zod avant tout traitement métier.
- **Tolérance zéro sur l'outillage de qualité** : ESLint et Prettier DOIVENT être configurés et scrupuleusement respectés. Aucun avertissement (zero warning) n'est toléré lors des vérifications statiques et de la CI.
*Rationale* : Garantit la maintenabilité du code, réduit les anomalies à l'exécution et maintient une cadence de développement pérenne.

### II. Sécurité & Protection des Données
- **Hachage des mots de passe** : Les mots de passe DOIVENT être hachés exclusivement avec l'algorithme Argon2id (avec sel cryptographique fort). Ils ne DOIVENT JAMAIS transiter ou résider en clair, ni apparaître dans les journaux d'événements (logs).
- **Gestion des sessions** : Les sessions utilisateur DOIVENT être persistées dans la base de données PostgreSQL. Le cookie de session DOIT impérativement porter les attributs `HttpOnly`, `Secure` et `SameSite=Lax`. Le stockage de jetons ou secrets dans `localStorage` ou `sessionStorage` est STRICTEMENT INTERDIT.
- **Tokens temporaires à usage unique** : Les jetons de vérification d'adresse email et de réinitialisation de mot de passe DOIVENT être cryptographiquement aléatoires, stockés sous forme de hachage en base de données, à usage unique et assortis d'un délai d'expiration strict.
- **Limitation de débit (Rate Limiting)** : Un rate limiting strict est OBLIGATOIRE sur l'ensemble des routes d'authentification et de réinitialisation pour contrecarrer les attaques par force brute.
- **Sécurité réseau et requêtes** : Protection CSRF active, en-têtes de sécurité HTTP stricts (Security Headers / Helmet) et politique CORS restrictive limitant l'accès aux seules origines autorisées.
- **Authentification OAuth** : Les flux OAuth (Google, ORCID) DOIVENT obligatoirement exploiter le paramètre cryptographique `state` et le protocole PKCE (Proof Key for Code Exchange).
- **Messages d'erreur génériques** : Les retours d'erreurs d'authentification DOIVENT être génériques afin de ne jamais révéler l'existence ou l'état d'un compte utilisateur (anti-énumération d'emails).
- **Gestion des secrets** : AUCUN secret ou clé privée ne doit être versionné dans le dépôt de code. La configuration DOIT passer exclusivement par des variables d'environnement, et un fichier `.env.example` complet et à jour DOIT être fourni.
- **Cloisonnement strict des données** : Chaque utilisateur ne DOIT accéder qu'à ses propres données. Chaque requête de lecture, modification ou suppression DOIT vérifier explicitement l'appartenance des ressources à l'utilisateur authentifié (prévention des vulnérabilités IDOR).
*Rationale* : Verso héberge les écrits, carnets de rimes et œuvres artistiques confidentielles de ses utilisateurs ; la sécurité et l'étanchéité des données sont absolues et non négociables.

### III. Design & Expérience Utilisateur
- **Minimalisme et élégance** : L'interface DOIT être sobre, élégante et axée sur la concentration de l'artiste. La typographie DOIT être soignée, les espaces généreux, la palette de couleurs restreinte et les animations discrètes et fluides.
- **Directives de conception UI** : Les règles du skill `frontend-design` DOIVENT impérativement être lues et appliquées avant toute création ou refonte d'interface.
- **Thèmes et mobilité** : Support complet et sans faille du mode sombre (dark mode) et du mode clair (light mode). Conception mobile-first obligatoire, assurant une ergonomie optimale sur smartphone lors des sessions d'écriture nomades ou en studio.
- **Accessibilité** : L'application DOIT respecter les standards d'accessibilité web (contrastes suffisants, navigation intégrale au clavier, balises et labels explicites pour les lecteurs d'écran).
*Rationale* : L'art de l'écriture rap exige une interface sans distraction cognitive, capable d'accompagner l'auteur partout et dans toutes les conditions lumineuses.

### IV. Architecture & Gestion des Médias
- **Socle technologique** : L'application s'appuie sur React et Tailwind CSS côté frontend, et sur Node.js avec Prisma ORM et PostgreSQL côté backend.
- **Découplage des médias audio** : Les fichiers audio (enregistrements, maquettes, instrumentales) DOIVENT être hébergés en dehors de la base de données relationnelle, sur un service de stockage d'objets compatible S3. La base de données PostgreSQL DOIT stocker uniquement les clés ou URLs d'accès sécurisées vers ces objets.
*Rationale* : Assure la scalabilité des performances de la base de données relationnelle et optimise la distribution et le streaming des flux audio volumineux.

### V. Tests & Stratégie de Livraison
- **Couverture de tests** : Des tests unitaires rigoureux DOIVENT couvrir l'intégralité de la logique métier et des flux d'authentification. Des tests d'intégration DOIVENT valider les routes d'API critiques et les interactions de persistance.
- **Migrations de schéma** : Toute modification du modèle de données DOIT être appliquée via des migrations Prisma versionnées, reproductibles et traçables.
- **Discipline de livraison Git** :
  - **Interdiction formelle de travailler sur `main`** : Il est STRICTEMENT INTERDIT de modifier ou commiter directement sur la branche `main`. Tout développement DOIT s'effectuer sur la branche active si différente de `main`, ou sur la branche `dev` créée à cet effet, ou sur une branche thématique dédiée.
  - **Format des commits** : Les messages de commit DOIVENT respecter le format Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`) avec une description claire et précise rédigée en français.
  - **Atomicité** : Commits petits et ciblés : une seule fonctionnalité, correction ou documentation à la fois.
  - **Exclusion stricte des secrets et médias** : Il est STRICTEMENT INTERDIT de commiter un quelconque fichier `.env`, tout secret/clé ou tout fichier audio de test.
  - **Synchronisation distante** : Une fois la tâche achevée, les changements DOIVENT être poussés avec suivi vers le dépôt distant (`git push -u origin <branche>`). Si le push échoue, le processus DOIT immédiatement s'interrompre afin d'expliquer le problème.
*Rationale* : Prévient les régressions en production, protège la branche de production contre les instabilités et fuites de données, et garantit une traçabilité rigoureuse de chaque changement.

## Standards d'Ingénierie & Contraintes Techniques

- **Environnement d'exécution** : Node.js (LTS), TypeScript avec compilation stricte (`"strict": true`, `"noImplicitAny": true`).
- **Composants Frontend** : React avec composants fonctionnels purs, hooks typés, architecture modulaire et stylisation utilitaire via Tailwind CSS.
- **Couche Données & Backend** : PostgreSQL hébergé, modélisé et accédé via Prisma Client. Schémas de base de données normalisés avec contraintes d'intégrité référentielle strictes.
- **Stockage Objets** : Solution compatible S3 pour les fichiers binaires audio avec URLs signées temporaires pour le streaming ou le téléchargement si nécessaire.
- **Validation & Contrats d'API** : Schémas Zod partagés ou dédiés, validés systématiquement en amont des contrôleurs backend.
- **Sécurité applicative** : Argon2id pour l'empreinte des mots de passe, sessions sécurisées en base PostgreSQL, protection CSRF, headers sécurisés (Helmet) et CORS strict.

## Portes de Qualité & Processus de Revue

Chaque contribution et incrément de fonctionnalité DOIT satisfaire aux portes de qualité suivantes :
1. **Porte d'analyse statique** : Validation réussie de `eslint` et `prettier` sans aucun avertissement ni erreur tolérée. Vérification du typage TypeScript sans erreur (`tsc --noEmit`).
2. **Porte de sécurité** : Validation stricte des entrées via Zod, vérification de l'isolation des données utilisateur sur chaque route, absence totale de token en `localStorage`, et absence de secret en dur dans le code.
3. **Porte d'expérience utilisateur** : Respect du skill `frontend-design`, vérification du rendu en mode clair et sombre, ergonomie mobile-first testée et conformité des contrastes d'accessibilité.
4. **Porte de test** : Exécution et succès de la suite de tests unitaires (logique métier & auth) et d'intégration (routes critiques).
5. **Porte de persistance** : Présence de migrations Prisma versionnées et testées pour tout changement de modèle de données.
6. **Porte de versionnement Git** : Respect impératif de la branche de travail (`dev` ou branche dédiée, jamais `main`), commits atomiques au format Conventional Commits en français (`feat:`, `fix:`, `docs:`, `chore:`, `test:`), aucun secret/.env/audio commité, et synchronisation distante (`git push -u origin <branche>`).

## Governance

- **Suprématie constitutionnelle** : La présente constitution prévaut sur toute autre documentation, habitude de développement ou choix d'implémentation. Tout code ou proposition de fonctionnalité ne respectant pas ces principes DOIT être refusé ou corrigé.
- **Dérogations exceptionnelles** : Toute dérogation ponctuelle (par exemple le typage d'une librairie tierce non typée requérant un contournement explicite) DOIT être documentée, justifiée techniquement et explicitement validée en revue de code.
- **Procédure d'amendement** : Toute modification de cette constitution nécessite la formalisation d'une proposition, une justification rigoureuse et une mise à jour du numéro de version selon la norme SemVer :
  - **MAJOR** : Suppression, affaiblissement ou modification fondamentale d'un principe non négociable ou de l'architecture centrale.
  - **MINOR** : Ajout d'un nouveau principe, d'une nouvelle section ou d'une directive d'ingénierie enrichissant la gouvernance sans casser les acquis.
  - **PATCH** : Clarification de formulation, correction typographique ou ajustement mineur sans impact sémantique sur les règles.
- **Contrôle de conformité** : Chaque cycle de spécification (`speckit-specify`), de planification (`speckit-plan`) et d'implémentation (`speckit-implement`) DOIT systématiquement vérifier sa conformité avec les articles de cette constitution.

**Version**: 1.0.1 | **Ratified**: 2026-10-03 | **Last Amended**: 2026-10-03
