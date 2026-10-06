<!--
SYNC IMPACT REPORT
==================
Version change: 1.1.0 → 2.0.0
Ratification Date: 2026-10-03
Last Amended Date: 2026-10-06

Modified Principles:
- II. Sécurité & Protection des Données :
  * Remplacement de la règle d'isolation stricte par : "Un utilisateur n'accède qu'à ses propres données et à celles qui ont été explicitement partagées avec lui, selon son rôle."
  * Ajout de l'obligation de faire passer toute décision d'accès (lecture, écriture, commentaire, partage, suppression) par une fonction centrale unique (par exemple `can(utilisateur, ressource, action)`), testée de façon exhaustive, sans aucun contournement par les routes ou composants.
  * Ajout de la règle de réponse identique "introuvable" (HTTP 404) lorsqu'une ressource n'est pas accessible (anti-fuite d'existence).
  * Exigence sur les invitations : acceptées explicitement, expirables, révocables et token d'invitation haché en base.
  * Ajout de l'attribution systématique de chaque modification d'un texte partagé à son auteur et conservation de l'auteur de chaque version dans l'historique.
  * Ajout des droits de blocage et de signalement d'abus, avec interdiction de révéler toute donnée personnelle (email) sans accord.
  * Extension du rate limiting aux invitations, commentaires et recherche d'utilisateurs (anti-harcèlement et anti-énumération).
  * Affichage de tout contenu collaboratif (commentaires, noms) sans injection de HTML (neutralisation XSS).
- V. Tests & Stratégie de Persistance :
  * Ajout des tests unitaires exhaustifs obligatoires pour la fonction centrale d'autorisation `can`.

Added Principles:
- None

Modified Sections:
- Standards d'Ingénierie & Contraintes Techniques (intégration de la fonction `can`, des tokens d'invitations hachés, du rate limiting étendu, de la protection XSS collaborative et de la vie privée).
- Cadre de Priorisation & Portes de Qualité (enrichissement du palier P3 avec le périmètre collaboratif sécurisé et mise à niveau des Quality Gates Sécurité et Tests).

Removed Sections:
- None

Follow-up TODOs:
- None (tous les principes sont déclaratifs, testables et résolus).
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
- **Gestion des tokens & invitations** : Les invitations sont acceptées explicitement, expirent, et sont révocables. Un lien d'invitation est un token haché en base. Plus largement, tous les tokens (vérification email, réinitialisation de mot de passe, liens de partage et d'invitation) DOIVENT être cryptographiquement aléatoires, hachés en base, assortis d'une expiration stricte et révocables à tout moment. Les tokens de vérification d'email DOIVENT être à usage unique.
- **Limitation de débit (Rate Limiting)** : Rate limiting OBLIGATOIRE sur toutes les routes d'authentification et sur l'accès aux liens publics / partagés, ainsi que sur les invitations, commentaires et recherche d'utilisateurs, pour éviter le harcèlement et l'énumération de comptes.
- **Sécurité réseau et requêtes** : Protection CSRF active, en-têtes de sécurité HTTP stricts (Helmet) et CORS restrictif limitant l'accès aux seules origines autorisées.
- **OAuth** : Intégrations OAuth (Google, ORCID) exploitant obligatoirement le paramètre `state` et le protocole PKCE.
- **Confidentialité de l'authentification** : Messages d'erreur génériques interdisant formellement de révéler l'existence ou l'état d'un compte (anti-énumération d'emails).
- **Zéro secret dans le code** : Tout secret DOIT provenir de variables d'environnement. Un fichier `.env.example` complet et à jour DOIT être maintenu.
- **Cloisonnement et accès aux données** : Un utilisateur n'accède qu'à ses propres données et à celles qui ont été explicitement partagées avec lui, selon son rôle. Chaque requête DOIT vérifier explicitement les autorisations d'accès (prévention IDOR).
- **Autorisation centralisée unique (`can`)** : Toute décision d'accès (lecture, écriture, commentaire, partage, suppression) passe par une fonction centrale unique (par exemple `can(utilisateur, ressource, action)`), testée de façon exhaustive. Aucune route ni aucun composant ne contourne cette fonction.
- **Confidentialité et anti-fuite d'existence** : Réponse identique "introuvable" quand une ressource n'est pas accessible (pas de fuite d'existence).
- **Textes privés par défaut & Partage contrôlé** : Tous les textes et brouillons sont STRICTEMENT PRIVÉS par défaut. L'accès par un tiers n'existe que par partage explicite ou invitation acceptée, selon les rôles définis (lecture, écriture, commentaire).
- **Attribution des modifications & Historique des versions** : Chaque modification d'un texte partagé est attribuée à son auteur. L'historique conserve l'auteur de chaque version.
- **Protection des utilisateurs, modération & Vie privée** : Un utilisateur peut bloquer un autre utilisateur et signaler un abus. Aucune donnée personnelle (email) n'est révélée à un autre utilisateur sans son accord.
- **Contenu collaboratif sans injection HTML** : Tout contenu collaboratif (commentaires, noms) est affiché sans injection de HTML.
*Rationale* : Protège la propriété intellectuelle, les textes confidentiels, l'intégrité des œuvres et la vie privée des artistes contre toute fuite, intrusion ou malveillance, tout en encadrant de manière rigoureuse la collaboration créative.

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
- **Couverture de tests** : Tests unitaires obligatoires sur toute la logique métier et l'authentification. Tests exhaustifs obligatoires de la fonction centrale d'autorisation `can`. Tests d'intégration obligatoires sur l'ensemble des routes critiques.
- **Évolution de la base de données** : Migrations Prisma versionnées, reproductibles et traçables pour toute modification du schéma.
*Rationale* : Prévient les régressions fonctionnelles, garantit l'inviolabilité des contrôles d'accès et sécurise la structure des données lors de chaque déploiement.

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
- **Sécurité applicative & Autorisations** : Validation Zod côté serveur, fonction centrale d'autorisation `can(utilisateur, ressource, action)` systématique, réponse 404 neutre sans fuite d'existence, Argon2id pour les mots de passe, sessions PostgreSQL en cookies HttpOnly/Secure/SameSite=Lax, rate limiting étendu (auth, liens publics, invitations, commentaires, recherche d'utilisateurs), protection CSRF, Helmet, CORS strict, et affichage sans injection HTML pour tout contenu collaboratif.
- **Collaboration & Vie privée** : Tokens d'invitations hachés en base (acceptation explicite, expiration, révocabilité), traçabilité de chaque modification et conservation de l'auteur dans l'historique des versions, blocage d'utilisateurs, signalement d'abus, et interdiction absolue de révéler l'email ou toute donnée personnelle sans accord.
- **Secrets** : Fichier `.env.example` versionné, variables d'environnement pour toute clé secrète, aucun secret dans le code ni dans la documentation.

## Cadre de Priorisation & Portes de Qualité

### Grille de Priorités des Fonctionnalités
Le développement s'organise selon trois niveaux d'exigence séquentiels :
- **P1 — Socle Indispensable** : Architecture de base, authentification sécurisée (Argon2id, sessions PostgreSQL), éditeur de texte minimaliste, sauvegarde automatique résiliente, modèle de données des textes, cloisonnement des données.
- **P2 — Confort d'Écriture & Musique** : PWA installable, support complet du mode hors ligne avec synchronisation automatique, gestion et association des instrumentales et maquettes audio (stockage compatible S3), organisation avancée (albums, morceaux, couplets).
- **P3 — Collaboration, Partage & Bonus** : Collaboration sécurisée (rôles, autorisations via la fonction centrale `can`, invitations révocables avec token haché, attribution des versions, commentaires sans injection HTML, blocage et signalement d'abus, protection des emails), liens de partage privés révocables en lecture seule avec rate limiting, authentification OAuth (Google, ORCID), enrichissements artistiques et options d'export.

> **Règle de transition stricte** : Il est STRICTEMENT INTERDIT d'aborder une priorité supérieure (ex: P2 ou P3) tant que la priorité précédente n'est pas intégralement développée, testée, documentée et stabilisée.

### Portes de Qualité (Quality Gates)
Chaque étape de spécification, planification et implémentation DOIT franchir successivement :
1. **Porte d'analyse statique** : Validation réussie de `eslint` et `prettier` sans aucun avertissement ni erreur tolérée. Vérification du typage TypeScript sans erreur (`tsc --noEmit`).
2. **Porte de sécurité & Autorisations** : Validation Zod côté serveur sur chaque route, mots de passe sous Argon2id, absence de token en `localStorage`, textes privés par défaut, passage exclusif par la fonction centrale `can` pour toute décision d'accès, réponse 404 neutre sans fuite d'existence, protection XSS sur les contenus collaboratifs, rate limiting (auth, liens, invitations, commentaires, recherche) et respect de la vie privée (aucune donnée personnelle exposée sans accord).
3. **Porte d'expérience utilisateur & Résilience** : Respect du skill `frontend-design`, compatibilité mode clair/sombre, ergonomie mobile-first, sauvegarde automatique sans interruption de frappe même hors réseau.
4. **Porte de persistance & Tests** : Migrations Prisma versionnées, tests unitaires exhaustifs de la fonction `can`, tests unitaires métier/auth validés, tests d'intégration sur routes critiques validés.
5. **Porte de livraison & Handoff** : Respect de la branche `dev`/feature, mise à jour préalable de `HANDOFF.md` et `README.md`, commit Conventional Commits en français, push sur `origin/<branche>`.

## Governance

- **Suprématie constitutionnelle** : La présente constitution prévaut sur toute documentation informelle ou habitude de développement. Tout code non conforme aux principes non négociables DOIT être refusé ou refactorisé.
- **Dérogations exceptionnelles** : Toute dérogation ponctuelle DOIT être documentée, justifiée techniquement et explicitement validée.
- **Procédure d'amendement** : Toute modification de cette constitution nécessite la formalisation d'une proposition, une justification rigoureuse et une incrémentation de version selon SemVer :
  - **MAJOR** : Suppression, affaiblissement ou refonte d'un principe non négociable ou de l'architecture centrale.
  - **MINOR** : Ajout d'un nouveau principe, d'une nouvelle section ou d'une directive d'ingénierie enrichissant la gouvernance sans casser les acquis.
  - **PATCH** : Clarification de formulation, correction typographique ou ajustement mineur sans impact sémantique.
- **Audit de conformité** : Chaque cycle de spécification (`speckit-specify`), de planification (`speckit-plan`) et d'implémentation (`speckit-implement`) DOIT systématiquement vérifier sa conformité avec les articles de cette constitution.

**Version**: 2.0.0 | **Ratified**: 2026-10-03 | **Last Amended**: 2026-10-06
