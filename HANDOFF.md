# Verso — Journal de Passation (HANDOFF)

## État actuel

- **Phase en cours** : Phase 0 — Cadrage, Gouvernance, Protocoles et Initialisation du Dépôt.
- **Ce qui est terminé** :
  - Définition et ratification de la constitution du projet ([.specify/memory/constitution.md](file:///home/normanxcat/Lab/verso/.specify/memory/constitution.md) en version `1.0.1`).
  - Intégration des principes non négociables : Qualité de code (TypeScript strict, Zod, zero-warning ESLint/Prettier), Sécurité (Argon2id, sessions PostgreSQL avec cookies HttpOnly/Secure/SameSite=Lax, rate limiting, isolation des données), Design (minimaliste, mobile-first, accessibilité, application de `frontend-design`), Architecture (React + Tailwind CSS, Node.js + Prisma + PostgreSQL, stockage audio compatible S3 externe), Tests et livraison.
  - Configuration du fichier racine [.gitignore](file:///home/normanxcat/Lab/verso/.gitignore) interdisant strictement l'ajout de `.env`, secrets et fichiers audio de test.
  - Mise en place du workflow Git sécurisé : abandon de `main`, basculement sur `dev`, convention de commits en français, push sur `origin/dev`.
  - Intégration du protocole strict des règles de fin de tâche (lint/tests, HANDOFF/README, branche dev, git add/commit, git push, résumé court).
  - Documentation socle du projet ([HANDOFF.md](file:///home/normanxcat/Lab/verso/HANDOFF.md) et [README.md](file:///home/normanxcat/Lab/verso/README.md)).
- **Ce qui est en cours** :
  - Clôture de la phase d'initialisation et préparation du cadrage fonctionnel.
- **Ce qui reste à faire** :
  - **[P1]** Cadrage et spécification de la première fonctionnalité (Authentification sécurisée et sessions) via `/speckit-specify`.
  - **[P1]** Initialisation du squelette applicatif (frontend React/Tailwind, backend Node.js/Prisma/PostgreSQL).
  - **[P2]** Configuration des outils de qualité de code (ESLint, Prettier, TypeScript strict en CI/CD).
  - **[P2]** Configuration du service de stockage d'objets compatible S3 pour les médias audio.
  - **[P3]** Intégration des fournisseurs OAuth (Google, ORCID) avec state et PKCE.

## Dernière action

- **Action exécutée** : Intégration et application du protocole strict des règles de fin de tâche dans la documentation et le suivi de projet.
- **Résultat** : Protocole documenté et vérifié, `HANDOFF.md` et `README.md` parfaitement synchronisés avec l'état réel du dépôt.

## Décisions prises

- **Protocole strict de fin de tâche en 6 étapes ordonnées** : Garantit la cohérence, la qualité, la non-régression et la traçabilité avant chaque clôture d'intervention.
- **TypeScript strict intégral sans any non justifié** : Élimine les erreurs d'exécution à la source et garantit la maintenabilité.
- **Sessions en base PostgreSQL avec cookies HttpOnly, Secure et SameSite=Lax** : Bloque les attaques XSS en proscrivant les tokens dans le `localStorage`.
- **Hachage Argon2id** : Protection maximale des mots de passe contre les attaques par force brute et le matériel dédié.
- **Validation serveur obligatoire avec Zod** : Garantit l'intégrité absolue des entrées avant traitement métier.
- **Stockage audio externe compatible S3** : Préserve la réactivité de la base relationnelle PostgreSQL et allège les sauvegardes.
- **Interdiction formelle de travailler sur main** : Sécurise la branche de production en imposant `dev` et les branches de travail dédiées.
- **Conventional Commits en français** : Unifie l'historique et assure une lisibilité immédiate des changements.
- **Règle de documentation systématique avant commit** : Garantit la fraîcheur permanente de `HANDOFF.md` et du `README.md`.

## Branche et dernier commit

- **Branche active** : `dev`
- **Dernier commit** : `d228bb6` — `docs: mise à jour du handoff et du README`

## Comment lancer le projet

Le projet est actuellement en phase de cadrage et outillage Spec Kit. Le squelette de code applicatif (`package.json`) sera mis en place lors de la première phase d'implémentation.

### Commandes actuelles disponibles

```bash
# Vérifier la branche courante (doit être différente de main)
git branch --show-current

# Vérifier la syntaxe des scripts bash
bash -n .specify/scripts/bash/*.sh
```

### Commandes cibles (prévues dès l'initialisation du code source)

```bash
# Installation des dépendances
npm install

# Démarrage des conteneurs locaux (PostgreSQL, stockage objet)
docker compose up -d

# Exécution des migrations de base de données
npx prisma migrate dev

# Lancement de l'environnement de développement
npm run dev

# Exécution des tests unitaires et d'intégration
npm test

# Contrôle qualité (lint et vérification de typage TypeScript)
npm run lint
npm run typecheck
```

## Variables d'environnement

Liste des variables requises par l'architecture (noms uniquement, aucune valeur) :

- `DATABASE_URL` : URL de connexion PostgreSQL pour Prisma ORM.
- `SESSION_SECRET` : Clé secrète pour la signature et le chiffrement des cookies de session.
- `PORT` : Port d'écoute du serveur backend HTTP.
- `NODE_ENV` : Environnement d'exécution (`development`, `test`, `production`).
- `CLIENT_URL` : URL de l'interface client autorisée pour la politique CORS et les redirections.
- `S3_ENDPOINT` : Point de terminaison de l'API de stockage d'objets compatible S3.
- `S3_REGION` : Région du bucket de stockage.
- `S3_BUCKET_NAME` : Nom du compartiment pour les fichiers audio.
- `S3_ACCESS_KEY_ID` : Identifiant de clé d'accès au stockage compatible S3.
- `S3_SECRET_ACCESS_KEY` : Clé secrète d'accès au stockage compatible S3.
- `GOOGLE_CLIENT_ID` : Identifiant client pour le fournisseur OAuth Google.
- `GOOGLE_CLIENT_SECRET` : Secret client pour le fournisseur OAuth Google.
- `ORCID_CLIENT_ID` : Identifiant client pour le fournisseur OAuth ORCID.
- `ORCID_CLIENT_SECRET` : Secret client pour le fournisseur OAuth ORCID.

## Problèmes connus et points d'attention

- Le code source applicatif (React / Node.js) n'est pas encore initialisé ; le dépôt contient actuellement l'outillage Spec Kit et la documentation de gouvernance.
- Toujours vérifier que la branche active est `dev` ou une branche de fonctionnalité avant toute modification de fichier.
- Ne jamais commiter de fichier `.env`, de clé secrète ni de fichier audio de test.
- Respecter obligatoirement le protocole de fin de tâche dans l'ordre strict des 6 étapes.

## Prochaine étape

- **Commande recommandée** : `/speckit-specify` pour lancer la spécification de la première fonctionnalité (Socle technique ou Authentification sécurisée).
- **Prompt recommandé** :
  ```text
  /speckit-specify Définir la spécification de la fonctionnalité d'authentification et de gestion de session (inscription, connexion, sessions sécurisées en base PostgreSQL, Argon2id, rate limiting)
  ```
