# Verso — Journal de Passation (HANDOFF)

## État actuel

- **Phase en cours** : Phase 0 — Cadrage, Gouvernance et Spécification Initiale.
- **Ce qui est terminé** :
  - Ratification de la constitution du projet ([.specify/memory/constitution.md](file:///home/normanxcat/Lab/verso/.specify/memory/constitution.md) en version `1.1.0`).
  - Définition des 7 principes fondamentaux non négociables :
    1. Qualité du code (TypeScript strict, Zod serveur obligatoire, zero-warning ESLint/Prettier).
    2. Sécurité & Protection des données (Argon2id, sessions PostgreSQL avec cookies HttpOnly/Secure/SameSite=Lax, tokens d'email à usage unique, tokens de partage révocables avec rate limiting, textes privés par défaut).
    3. Design & Expérience utilisateur (minimaliste, application du skill `frontend-design`, dark/light mode, mobile-first, accessibilité, écriture ininterrompue avec sauvegarde automatique).
    4. Architecture, Médias & PWA (React + Tailwind CSS, Node.js + Prisma + PostgreSQL, stockage audio compatible S3 externe, PWA installable avec écriture hors ligne et synchronisation).
    5. Tests & Stratégie de persistance (tests unitaires sur logique/auth, intégration sur routes critiques, migrations Prisma versionnées).
    6. Workflow Git obligatoire (interdiction de main, branches dev/features, commit Conventional Commits en français et push après chaque commande/phase, zéro secret).
    7. Documentation & Handoff obligatoire (HANDOFF.md et README.md mis à jour avant chaque commit, autonomie totale pour un nouvel agent, statut ✅ réservé au code implémenté et testé).
  - Établissement du cadre de priorisation séquentiel : P1 (socle indispensable) → P2 (confort d'écriture & musique) → P3 (partage & bonus). Règle de transition stricte : interdiction de démarrer une priorité supérieure tant que la précédente n'est pas stabilisée.
  - Configuration du fichier racine [.gitignore](file:///home/normanxcat/Lab/verso/.gitignore) (blocage strict de `.env`, secrets et médias audio).
  - Branche `dev` configurée et synchronisée avec `origin/dev`.
- **Ce qui est en cours** :
  - Clôture de la mise à jour constitutionnelle v1.1.0 et préparation de la première spécification (P1).
- **Ce qui reste à faire** :
  - **[P1 - Socle Indispensable]** :
    - Spécification et cadrage de l'authentification sécurisée et de la gestion de sessions via `/speckit-specify`.
    - Initialisation du squelette applicatif (React + Tailwind, Node.js + Prisma + PostgreSQL).
    - Mise en place du modèle de données des textes, de l'éditeur minimaliste et de la sauvegarde automatique.
    - Configuration de la suite de tests unitaires/intégration et de l'outillage de linting.
  - **[P2 - Confort d'Écriture & Musique]** (après stabilisation P1) :
    - Configuration PWA installable et persistance locale (IndexedDB) pour écriture hors ligne et synchronisation.
    - Intégration du stockage compatible S3 pour les instrumentales et maquettes audio.
  - **[P3 - Partage & Bonus]** (après stabilisation P2) :
    - Liens de partage privés révocables en lecture seule avec rate limiting.
    - Fournisseurs OAuth (Google, ORCID) avec state et PKCE.

## Dernière action

- **Action exécutée** : Mise à jour de la constitution en version `1.1.0` via `/speckit-constitution` intégrant les 7 principes fondamentaux, l'architecture PWA hors ligne, la sécurité des liens de partage, les textes privés par défaut et le cadre de priorités P1/P2/P3.
- **Résultat** : Constitution v1.1.0 enregistrée, validée sans placeholder, et synchronisée avec la gouvernance du projet.

## Décisions prises

- **PWA installable avec support hors ligne total et synchronisation** : Permet aux rappeurs d'écrire partout (studios sans réseau, transports) sans dépendre d'une connexion Internet.
- **Continuité absolue de l'écriture et sauvegarde automatique temps réel** : Élimine toute perte de données lors d'une déconnexion brutale du réseau.
- **Textes privés par défaut et liens de partage révocables en lecture seule** : Sécurité maximale de la propriété intellectuelle des artistes.
- **Rate limiting sur authentification et liens publics** : Protection contre les attaques par déni de service et force brute.
- **Cadre séquentiel strict P1 → P2 → P3** : Interdit la dispersion technique et garantit un socle robuste avant tout ajout de confort ou de bonus.
- **Interdiction formelle de travailler sur main et push obligatoire après chaque étape** : Assure une intégration continue propre et sécurisée.
- **Documentation systématique avant commit** : Maintient un état projet toujours actionnable pour n'importe quel nouvel agent.

## Branche et dernier commit

- **Branche active** : `dev`
- **Dernier commit** : `a20dfd3` — `docs: formalisation des 6 règles de fin de tâche obligatoires`

## Comment lancer le projet

Le projet est actuellement en phase de cadrage et outillage Spec Kit. Le code source applicatif sera généré lors des phases d'implémentation.

### Commandes actuelles disponibles

```bash
# Vérifier la branche courante (doit être dev ou feature)
git branch --show-current

# Vérifier la syntaxe des scripts bash Spec Kit
bash -n .specify/scripts/bash/*.sh
```

### Commandes cibles (applicables dès l'initialisation du code source)

```bash
# Installation des dépendances
npm install

# Démarrage des conteneurs locaux (PostgreSQL, stockage objet S3)
docker compose up -d

# Exécution des migrations de base de données Prisma
npx prisma migrate dev

# Lancement de l'environnement de développement (frontend + backend)
npm run dev

# Exécution des tests unitaires et d'intégration
npm test

# Contrôle qualité (lint et typage TypeScript strict)
npm run lint
npm run typecheck
```

## Variables d'environnement

Seuls les noms des variables prévues par l'architecture sont documentés (aucune valeur ni secret) :

- `DATABASE_URL` : URL de connexion PostgreSQL pour Prisma ORM.
- `SESSION_SECRET` : Clé secrète de signature et chiffrement des cookies de session HttpOnly.
- `PORT` : Port d'écoute du serveur backend HTTP.
- `NODE_ENV` : Mode d'exécution (`development`, `test`, `production`).
- `CLIENT_URL` : Origine autorisée pour la politique CORS et les redirections client.
- `S3_ENDPOINT` : Point de terminaison du service de stockage d'objets compatible S3.
- `S3_REGION` : Région du bucket S3.
- `S3_BUCKET_NAME` : Nom du compartiment de stockage pour les fichiers audio.
- `S3_ACCESS_KEY_ID` : Identifiant de la clé d'accès S3.
- `S3_SECRET_ACCESS_KEY` : Clé secrète d'accès S3.
- `GOOGLE_CLIENT_ID` : Identifiant client OAuth Google.
- `GOOGLE_CLIENT_SECRET` : Secret client OAuth Google.
- `ORCID_CLIENT_ID` : Identifiant client OAuth ORCID.
- `ORCID_CLIENT_SECRET` : Secret client OAuth ORCID.

## Problèmes connus et points d'attention

- Le code source applicatif (React / Node.js) n'est pas encore initialisé ; le dépôt contient actuellement l'outillage Spec Kit et la documentation de gouvernance.
- Toujours vérifier que la branche active est `dev` ou une branche de fonctionnalité avant toute modification de fichier.
- Ne jamais commiter de fichier `.env`, de secret ni de fichier audio de test.
- Respecter scrupuleusement le protocole de fin de tâche dans l'ordre strict des 6 étapes.
- Respecter la règle de transition stricte : ne pas entamer P2 tant que P1 n'est pas stable.

## Prochaine étape

- **Commande recommandée** : `/speckit-specify` pour définir la spécification du socle indispensable P1 (Authentification sécurisée et gestion des sessions).
- **Prompt recommandé** :
  ```text
  /speckit-specify Définir la spécification de la fonctionnalité P1 d'authentification et de gestion de session (inscription, connexion, sessions sécurisées en base PostgreSQL, cookies HttpOnly/Secure/SameSite=Lax, Argon2id, rate limiting)
  ```
