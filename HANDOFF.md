# Verso — Journal de Passation (HANDOFF)

## État actuel

- **Phase en cours** : Phase 1 — Spécification Validée & Clarifiée (Prêt pour la Planification).
- **Ce qui est terminé** :
  - Ratification de la constitution du projet ([.specify/memory/constitution.md](file:///home/normanxcat/Lab/verso/.specify/memory/constitution.md) en version `1.1.0`) avec ses 7 principes non négociables.
  - Spécification fonctionnelle complète du projet Verso ([specs/001-verso-core/spec.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/spec.md)) structurée selon la roadmap P1 (socle), P2 (confort/audio), P3 (bonus).
  - Clarification interactive (`/speckit-clarify`) de 5 points critiques directement intégrés dans la spécification :
    1. *Vérification email non bloquante* : accès immédiat à l'espace d'écriture dès l'inscription avec bannière persistante de rappel.
    2. *Liaison de comptes OAuth sécurisée* : confirmation obligatoire par saisie du mot de passe existant lors d'une première connexion Google/ORCID avec le même email.
    3. *Limites audio équilibrées* : jusqu'à 75 Mo par fichier en formats MP3 et WAV, et possibilité d'attacher jusqu'à 3 instrumentales distinctes par texte.
    4. *Résolution des conflits hors ligne sans perte* : conservation du texte distant intact et création automatique d'un nouveau brouillon distinct intitulé `[Titre] (copie hors ligne)` avec notification.
    5. *Conservation intégrale des versions* : aucune purge automatique et aucun plafond sur l'historique des versions, toutes les versions horodatées sont conservées indéfiniment.
  - Checklist qualité revalidée à 100% (16/16 critères respectés, [specs/001-verso-core/checklists/requirements.md](file:///home/normanxcat/Lab/verso/specs/001-verso-core/checklists/requirements.md)).
  - Branche `dev` active et synchronisée avec `origin/dev`.
- **Ce qui est en cours** :
  - Clôture de la phase de clarification et lancement imminent de `/speckit-plan`.
- **Ce qui reste à faire** :
  - **[P1 - Socle Indispensable]** :
    - Exécution de `/speckit-plan` pour définir l'architecture technique, le schéma de base de données PostgreSQL / Prisma, les contrats d'API et la stratégie de test.
    - Génération de la liste ordonnancée des tâches (`/speckit-tasks`).
    - Implémentation du squelette applicatif et des composants P1 (Auth Argon2id, Sessions PostgreSQL, Éditeur avec sauvegarde continue, Gestion d'albums).
  - **[P2 - Confort d'Écriture & Musique]** (après stabilisation de P1) :
    - Historique des versions, métrique des syllabes, lecteur audio avec boucle, stockage S3 externe, export PDF et liens de partage privés.
  - **[P3 - Partage & Bonus]** (après stabilisation de P2) :
    - PWA offline (IndexedDB), enregistrement vocal freestyle, dictionnaire de rimes françaises.

## Dernière action

- **Action exécutée** : Session de clarification fonctionnelle `/speckit-clarify` et intégration incrémentale de 5 décisions clés dans `specs/001-verso-core/spec.md`.
- **Résultat** : Spécification affinée, zéro ambiguïté restante sur les règles d'authentification, les quotas audio, les conflits hors ligne et la rétention d'historique.

## Décisions prises

- **Accès immédiat dès l'inscription avec bannière persistante** : Évite toute friction pour l'artiste inspiré tout en maintenant la pression pour la sécurisation de l'email.
- **Saisie préalable du mot de passe pour lier un compte OAuth** : Prévient les attaques par prise de contrôle de compte (account takeover) via des tiers OAuth.
- **75 Mo et jusqu'à 3 instrus par texte** : Permet de gérer différentes variantes d'arrangement (avec/sans refrain, maquette, master) sans surcharger le stockage.
- **Création d'un brouillon de copie lors d'un conflit hors ligne** : Garantit 100% de non-perte de texte en évitant toute écrasement silencieux ou modale bloquante.
- **Conservation permanente et illimitée de l'historique des versions** : Respecte la valeur patrimoniale des rimes et brouillons des rappeurs sans purge arbitraire.

## Branche et dernier commit

- **Branche active** : `dev`
- **Dernier commit** : `22dc8a4` — `feat: spécification fonctionnelle complète de la plateforme Verso (specs/001-verso-core)`

## Comment lancer le projet

### Commandes actuelles disponibles

```bash
# Vérifier la branche active (dev ou feature)
git branch --show-current

# Vérifier la syntaxe des scripts Spec Kit
bash -n .specify/scripts/bash/*.sh

# Consulter la spécification et ses clarifications
cat specs/001-verso-core/spec.md
```

### Commandes cibles (prévues dès l'initialisation du code source)

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

- Le code source applicatif (React / Node.js) n'est pas encore initialisé ; le dépôt contient l'outillage Spec Kit, la constitution et les spécifications validées.
- Toujours vérifier que la branche active est `dev` ou une branche de fonctionnalité avant toute modification.
- Ne jamais commiter de fichier `.env`, de secret ni de fichier audio de test.
- Respecter scrupuleusement le protocole de fin de tâche dans l'ordre strict des 6 étapes.
- Règle de transition stricte : ne pas entamer P2 tant que P1 n'est pas stable et testé.

## Prochaine étape

- **Commande recommandée** : `/speckit-plan` pour lancer la planification de l'implémentation technique du socle P1.
- **Prompt recommandé** :
  ```text
  /speckit-plan Planifier l'implémentation technique du socle P1 (Authentification sécurisée, Espace personnel, Éditeur de texte avec sauvegarde continue, Gestion d'albums)
  ```
