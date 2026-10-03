# Verso

Un espace d'écriture minimaliste pour rappeurs : textes, albums, brouillons et instrus au même endroit.

---

## Description

**Verso** est une application web conçue spécialement pour les rappeurs et artistes du texte. Elle propose un environnement d'écriture sobre, sans distraction, facilitant l'élaboration de textes, la gestion d'albums, l'organisation de brouillons et l'association directe d'instrumentales et de maquettes audio.

Le projet est gouverné par des règles strictes de qualité de code, de sécurité des données, de respect de la vie privée et de sobriété ergonomique (mobile-first, modes clair et sombre).

---

## Fonctionnalités

| Fonctionnalité | Statut | Description |
| :--- | :---: | :--- |
| **Constitution & Gouvernance du projet** | ✅ Fait | Principes non négociables inscrits dans la constitution (v1.0.1) |
| **Gestion Git & Protection des secrets** | ✅ Fait | Branche `dev` active, `.gitignore` racine bloquant `.env`, secrets et audio |
| **Documentation & Suivi de passation** | ✅ Fait | `README.md` et `HANDOFF.md` tenus à jour à chaque étape |
| **Outillage Spec Kit** | ✅ Fait | Workflows et scripts de spécification, planification et implémentation |
| **Système d'Authentification sécurisée** | ⏳ Prévu | Mots de passe Argon2id, sessions PostgreSQL en cookies HttpOnly/Secure/SameSite=Lax, rate limiting |
| **OAuth (Google & ORCID)** | ⏳ Prévu | Authentification tierce avec paramètres state et PKCE |
| **Éditeur d'écriture minimaliste** | ⏳ Prévu | Interface sobre, contrastes soignés, support mobile-first, dark/light mode |
| **Organisation des œuvres** | ⏳ Prévu | Classement par albums, morceaux, couplets et brouillons |
| **Stockage & Lecture des instrumentales** | ⏳ Prévu | Association de maquettes audio hébergées sur stockage compatible S3 |

---

## Stack technique

L'architecture validée dans la constitution du projet comprend :

- **Frontend** : React, Tailwind CSS
- **Backend** : Node.js, Prisma ORM, PostgreSQL
- **Stockage Objets** : Solution compatible S3 pour les médias audio
- **Typage & Validation** : TypeScript (mode strict intégral), Zod (validation serveur obligatoire)
- **Sécurité** : Argon2id, sessions sécurisées en base, protection CSRF, headers Helmet, CORS restrictif
- **Qualité & Tests** : ESLint, Prettier (politique zéro warning), tests unitaires et d'intégration

*(Note : le dépôt se trouve actuellement en phase initiale de spécification et outillage Spec Kit ; le code source applicatif sera initialisé lors des prochaines étapes).*

---

## Prérequis

- **Git** (v2.30+)
- **Bash** (pour l'exécution des scripts d'outillage sous `.specify/scripts/bash/`)
- **Node.js** (v20+ LTS recommandé pour le socle applicatif à venir)
- **PostgreSQL** (v15+ prévu pour le stockage des données et des sessions)

---

## Installation

1. Cloner le dépôt :
   ```bash
   git clone git@github.com:normanXCat/verso.git
   cd verso
   ```

2. Se placer sur la branche de développement :
   ```bash
   git checkout dev
   ```

*(L'installation des dépendances avec `npm install` sera disponible dès la mise en place du fichier `package.json` applicatif).*

---

## Lancement

### Vérification des outils du dépôt

Pour vérifier l'environnement d'outillage Spec Kit :
```bash
.specify/scripts/bash/check-prerequisites.sh
```

*(Les commandes de démarrage applicatif telles que `npm run dev` seront opérationnelles dès la génération du squelette React / Node.js).*

---

## Scripts disponibles

Les scripts actuellement présents dans le dépôt sont situés dans [.specify/scripts/bash/](file:///home/normanxcat/Lab/verso/.specify/scripts/bash/) :

- `check-prerequisites.sh` : Vérifie la disponibilité des outils nécessaires au workflow de spécification.
- `create-new-feature.sh` : Initialise une nouvelle branche et un dossier de spécification pour une fonctionnalité.
- `resolve-template.sh` : Résout les modèles de documents Spec Kit.
- `setup-plan.sh` : Prépare l'espace de planification d'une fonctionnalité.
- `setup-tasks.sh` : Prépare l'espace des tâches d'une fonctionnalité.

---

## Structure des dossiers

Voici l'arborescence actuellement présente dans le dépôt :

```text
verso/
├── .agents/                    # Compétences et agents d'automatisation (Spec Kit)
│   └── skills/                 # Définitions des compétences (specify, plan, tasks, implement, etc.)
├── .specify/                   # Configuration, modèles et mémoire de gouvernance
│   ├── memory/
│   │   └── constitution.md     # Constitution du projet (règles non négociables)
│   ├── scripts/bash/           # Scripts d'automatisation bash
│   ├── templates/              # Gabarits de spécification, plan, tâches et checklists
│   └── workflows/              # Définitions des flux de travail Spec Kit
├── .gitignore                  # Exclusion des dépendances, secrets, fichiers .env et médias audio
├── HANDOFF.md                  # Journal de passation et suivi d'état du projet
├── LICENSE                     # Licence du projet (MIT)
└── README.md                   # Documentation principale du projet
```

---

## Variables d'environnement

Seuls les noms des variables d'environnement prévues par l'architecture sont listés ci-dessous (aucune valeur ni secret n'est inclus) :

| Variable | Rôle |
| :--- | :--- |
| `DATABASE_URL` | Chaîne de connexion à la base de données PostgreSQL pour Prisma |
| `SESSION_SECRET` | Clé secrète pour le chiffrement et la signature des cookies de session |
| `PORT` | Port d'écoute du serveur backend HTTP |
| `NODE_ENV` | Environnement d'exécution (`development`, `test`, `production`) |
| `CLIENT_URL` | Origine autorisée pour la politique CORS et les redirections d'authentification |
| `S3_ENDPOINT` | Point de terminaison du service de stockage d'objets compatible S3 |
| `S3_REGION` | Région géographique du stockage S3 |
| `S3_BUCKET_NAME` | Nom du bucket dédié au stockage des fichiers audio |
| `S3_ACCESS_KEY_ID` | Identifiant d'accès au service compatible S3 |
| `S3_SECRET_ACCESS_KEY` | Clé secrète d'accès au service compatible S3 |
| `GOOGLE_CLIENT_ID` | Identifiant client de l'application OAuth Google |
| `GOOGLE_CLIENT_SECRET` | Secret client de l'application OAuth Google |
| `ORCID_CLIENT_ID` | Identifiant client de l'application OAuth ORCID |
| `ORCID_CLIENT_SECRET` | Secret client de l'application OAuth ORCID |

---

## Règles de contribution

1. **Interdiction formelle de travailler sur `main`** :
   - Tout travail DOIT être effectué sur la branche `dev` ou sur une branche thématique dédiée (ex: `feature/...`).
   - Ne jamais faire de push direct sur `main`.

2. **Convention de commits** :
   - Les commits DOIVENT impérativement respecter le standard Conventional Commits avec des messages clairs en français :
     - `feat:` Nouvelle fonctionnalité
     - `fix:` Correction d'un bug
     - `docs:` Modification de documentation
     - `chore:` Tâche de maintenance ou d'outillage
     - `test:` Ajout ou modification de tests
   - Chaque commit doit être atomique (une seule tâche ou fonctionnalité à la fois).

3. **Sécurité et exclusion des secrets** :
   - Ne jamais commiter de fichier `.env`, de mot de passe, de token, de clé secrète ou de fichier audio de test.
   - Les exclusions sont appliquées par [.gitignore](file:///home/normanxcat/Lab/verso/.gitignore).

4. **Documentation obligatoire avant commit** :
   - Mettre à jour systématiquement [HANDOFF.md](file:///home/normanxcat/Lab/verso/HANDOFF.md) et [README.md](file:///home/normanxcat/Lab/verso/README.md) avant tout commit pour refléter l'état réel du dépôt.

5. **Synchronisation distante** :
   - Pousser systématiquement les modifications terminées avec `git push -u origin <branche>`. En cas d'échec, le processus doit être immédiatement interrompu pour analyse.
