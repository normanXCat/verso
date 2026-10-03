# Verso

Un espace d'écriture minimaliste pour rappeurs permettant d'écrire, organiser, protéger et partager leurs textes.

---

## Description

**Verso** est une application web conçue pour les artistes du texte et rappeurs. Elle offre un environnement d'écriture sobre et sans distraction cognitive, garantissant une continuité absolue d'écriture (sauvegarde automatique en temps réel sans perte de données, support hors ligne complet via PWA), une organisation fluide (textes, albums, brouillons, instrus) et une protection stricte des œuvres (textes privés par défaut, partage exclusif par lien privé révocable en lecture seule).

Le projet est régi par une constitution stricte ([.specify/memory/constitution.md](file:///home/normanxcat/Lab/verso/.specify/memory/constitution.md)) qui impose une haute qualité de code, une sécurité sans compromis, une conception ergonomique soignée, une discipline Git rigoureuse et une mise à jour documentaire permanente.

---

## Fonctionnalités & Feuille de Route

Le projet suit un cadre de priorisation séquentiel strict (**P1** socle indispensable → **P2** confort d'écriture et musique → **P3** bonus). Une priorité supérieure n'est abordée que lorsque la précédente est totalement stable et testée.

| Priorité | Fonctionnalité | Statut | Description |
| :---: | :--- | :---: | :--- |
| **Socle** | **Constitution & Gouvernance v1.1.0** | ✅ Fait | 7 principes non négociables inscrits dans la constitution |
| **Socle** | **Discipline Git & Protection des données** | ✅ Fait | Branche `dev`, blocage des `.env`, secrets et audio via `.gitignore` |
| **Socle** | **Documentation & Handoff permanent** | ✅ Fait | `HANDOFF.md` et `README.md` mis à jour avant chaque commit |
| **Socle** | **Outillage Spec Kit** | ✅ Fait | Workflows et scripts de spécification, planification et tâches |
| **Socle** | **Spécification Fonctionnelle Verso Core** | ✅ Fait | Spécification complète, clarifiée et validée ([specs/001-verso-core/spec.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/spec.md)) |
| **P1** | **Authentification sécurisée & Sessions** | ⏳ Prévu | Mots de passe Argon2id, sessions PostgreSQL en cookies HttpOnly/Secure/SameSite=Lax, rate limiting |
| **P1** | **Éditeur d'écriture résilient** | ⏳ Prévu | Typographie soignée, sauvegarde automatique en continu, zéro perte de texte |
| **P1** | **Organisation des textes (Privés par défaut)** | ⏳ Prévu | Cloisonnement strict multi-tenant, vérification d'appartenance systématique |
| **P2** | **Application installable (PWA) & Mode Hors Ligne** | ⏳ Prévu | Écriture hors ligne totale (IndexedDB) et synchronisation au retour du réseau |
| **P2** | **Gestion des médias audio (Compatible S3)** | ⏳ Prévu | Fichiers audio stockés hors base, stockage de la clé uniquement en base |
| **P2** | **Organisation avancée des œuvres** | ⏳ Prévu | Structuration par albums, morceaux, couplets et annotations |
| **P3** | **Liens de partage privés révocables** | ⏳ Prévu | Partage explicite en lecture seule, tokens hachés révocables avec expiration et rate limiting |
| **P3** | **OAuth (Google & ORCID)** | ⏳ Prévu | Authentification tierce sécurisée avec state et PKCE |

*(Règle : une fonctionnalité n'est marquée ✅ que si elle est effectivement implémentée et testée dans le code).*

---

## Stack technique

- **Frontend** : React, Tailwind CSS
- **Backend** : Node.js, Prisma ORM, PostgreSQL
- **Stockage Objets** : Solution compatible S3 pour les instrumentales et fichiers audio
- **PWA & Offline** : Service Workers, IndexedDB pour la persistance locale et synchronisation
- **Typage & Validation** : TypeScript (mode strict intégral), Zod (validation serveur obligatoire)
- **Sécurité** : Argon2id, sessions sécurisées en base PostgreSQL, CSRF, Helmet, CORS restrictif, rate limiting
- **Qualité & Tests** : ESLint, Prettier (zéro warning toléré), tests unitaires et d'intégration

*(Note : le dépôt est actuellement en phase de cadrage et outillage Spec Kit ; le code applicatif sera généré lors des phases d'implémentation).*

---

## Prérequis

- **Git** (v2.30+)
- **Bash** (pour l'outillage Spec Kit sous `.specify/scripts/bash/`)
- **Node.js** (v20+ LTS recommandé pour le socle applicatif à venir)
- **PostgreSQL** (v15+ prévu pour les données et sessions)

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

*(L'installation via `npm install` sera effective dès la création du `package.json` applicatif).*

---

## Lancement

### Vérification des outils du dépôt

```bash
# Vérifier la syntaxe des scripts bash
bash -n .specify/scripts/bash/*.sh
```

*(Les commandes de démarrage applicatif `npm run dev` seront disponibles dès l'implémentation du squelette applicatif).*

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
│   │   └── constitution.md     # Constitution du projet (v1.1.0)
│   ├── scripts/bash/           # Scripts d'automatisation bash
│   ├── templates/              # Gabarits de spécification, plan, tâches et checklists
│   └── workflows/              # Définitions des flux de travail Spec Kit
├── specs/                      # Spécifications fonctionnelles et techniques
│   └── 001-verso-core/         # Spécification complète de la plateforme Verso
│       ├── checklists/         # Checklists de qualité des spécifications
│       │   └── requirements.md # Checklist de conformité de la spécification
│       └── spec.md             # Spécification fonctionnelle validée
├── .gitignore                  # Exclusion des dépendances, secrets, fichiers .env et médias audio
├── HANDOFF.md                  # Journal de passation et suivi d'état du projet
├── LICENSE                     # Licence du projet (MIT)
└── README.md                   # Documentation principale du projet
```

---

## Variables d'environnement

Seuls les noms des variables prévues par l'architecture sont documentés (aucun secret ni valeur) :

| Variable | Rôle |
| :--- | :--- |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL pour Prisma ORM |
| `SESSION_SECRET` | Clé secrète pour le chiffrement et la signature des cookies de session |
| `PORT` | Port d'écoute du serveur backend HTTP |
| `NODE_ENV` | Environnement d'exécution (`development`, `test`, `production`) |
| `CLIENT_URL` | Origine autorisée pour la politique CORS et les redirections d'authentification |
| `S3_ENDPOINT` | Point de terminaison du service de stockage d'objets compatible S3 |
| `S3_REGION` | Région géographique du stockage S3 |
| `S3_BUCKET_NAME` | Nom du compartiment de stockage pour les fichiers audio |
| `S3_ACCESS_KEY_ID` | Identifiant d'accès au stockage compatible S3 |
| `S3_SECRET_ACCESS_KEY` | Clé secrète d'accès au stockage compatible S3 |
| `GOOGLE_CLIENT_ID` | Identifiant client de l'application OAuth Google |
| `GOOGLE_CLIENT_SECRET` | Secret client de l'application OAuth Google |
| `ORCID_CLIENT_ID` | Identifiant client de l'application OAuth ORCID |
| `ORCID_CLIENT_SECRET` | Secret client de l'application OAuth ORCID |

---

## Règles de fin de tâche obligatoires

Chaque tâche exécutée DOIT impérativement respecter ce protocole dans l'ordre strict :

1. **Lint et tests** : Lancer le linter et la suite de tests (`npm run lint`, `npm test`, etc.) ; corriger toutes les erreurs avant de continuer.
2. **Documentation obligatoire** : Mettre à jour [HANDOFF.md](file:///home/normanxcat/Lab/verso/HANDOFF.md) (état actuel, dernière action, décisions, branche et dernier commit, comment lancer, variables d'environnement par nom seulement, problèmes connus, prochaine étape) et [README.md](file:///home/normanxcat/Lab/verso/README.md) (fonctionnalités avec statut, stack, installation, lancement, structure). Ne documenter que ce qui existe réellement dans le code.
3. **Discipline de branches** : Ne jamais travailler directement sur `main`. Utiliser la branche courante si ce n'est pas `main`, sinon créer et basculer sur `dev`.
4. **Staging & Commit** : `git add`, puis commit au format Conventional Commits en français (`feat:`, `fix:`, `docs:`, `chore:`, `test:`). Ne jamais commiter de fichier `.env`, de secret ni de fichier audio de test.
5. **Synchronisation distante** : `git push -u origin <branche>`. Si le push échoue, s'arrêter immédiatement et expliquer pourquoi.
6. **Compte-rendu final** : Terminer systématiquement par un résumé court : ce qui a été fait, ce qui reste, et la prochaine commande à lancer.
