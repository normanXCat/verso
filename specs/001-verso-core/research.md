# Recherche Technique & Décisions d'Architecture: Verso Core Platform

Ce document consigne les recherches, comparaisons et choix techniques validés pour la plateforme **Verso**, conformément à la constitution du projet (v1.1.0) et aux exigences du plan d'implémentation.

---

## 1. Moteur d'Édition de Texte & Rendu Poétique

### Contexte & Exigences
L'éditeur doit offrir une frappe ultra-fluide (zéro latence perçue), un support de la sauvegarde continue en temps réel (< 500 ms), un compteur de syllabes en marge de chaque vers et un surlignage dynamique en couleur des terminaisons rimiques, sans ralentir la saisie même sur des textes de plusieurs centaines de lignes.

### Options Évaluées
1. **CodeMirror 6** : Architecture modulaire moderne basée sur un arbre d'état immuable et des extensions (Decorations / ViewPlugin). Très performant, support natif des gouttières de marge (gutters) pour les syllabes, et décorations de texte pour les rimes.
2. **TipTap (ProseMirror)** : Très puissant pour l'édition riche (WYSIWYG), mais surcharge inutile pour un éditeur de paroles qui n'a pas besoin de gras/italique/titres dans les vers, et coût cognitif plus élevé pour synchroniser des calculs métriques ligne par ligne.
3. **Textarea custom avec overlay div** : Solution historique légère, mais difficile à synchroniser précisément lors du scroll, des césures de lignes automatiques (word-wrap) et des redimensionnements mobile.

### Décision Validée
- **Choix** : **CodeMirror 6** (avec thème minimaliste et extensions sur-mesure) ou un composant textarea contrôlé avec gutter de syllabes en mode simple.
- **Rationale** : CodeMirror 6 isole le calcul des décorations (rimes et syllabes) via un `ViewPlugin` et `StateField` asynchrone qui ne bloque jamais le thread principal d'entrée utilisateur. Il offre nativement un support parfait du responsive et des raccourcis clavier sans sur-ingénierie.
- **Alternatives rejetées** : TipTap (trop lourd et inadapté à la poésie en vers libres/métriques), Textarea brut avec overlays (problèmes récurrents d'alignement de police sous Safari mobile).

---

## 2. Authentification Maison, Sessions Sécurisées & OAuth

### Contexte & Exigences
- Mots de passe hachés sous Argon2id (constitutionnelle).
- Sessions persistées dans PostgreSQL avec cookie `HttpOnly`, `Secure`, `SameSite=Lax`. Zéro token dans le `localStorage`.
- OAuth (Google et ORCID) avec vérification `state` et PKCE.
- Liaison de compte avec confirmation par mot de passe si le compte existe déjà.
- Rate limiting sur auth et emails transactionnels via Resend (SMTP en local).

### Options Évaluées
1. **Système maison avec Fastify, `argon2` et `arctic`** :
   - `argon2` (`@node-rs/argon2` ou `argon2` natif) pour le hachage sécurisé résistant aux attaques GPU.
   - `arctic` : bibliothèque moderne, légère, zéro-dépendance pour OAuth 2.0 / OIDC avec support natif de PKCE et `state` pour Google, GitHub, etc., et adaptateur générique pour ORCID.
   - Plugin de session Fastify (`@fastify/session` ou gestion explicite par middleware/hook avec `cookie-signature` et table Prisma `Session`).
2. **NextAuth / Auth.js ou Lucia Auth** : Lucia Auth a déprécié son modèle au profit de patterns natifs, recommandant d'écrire son propre gestionnaire de session simple en base avec cookies cryptés.
3. **Passport.js** : Ancien, lourd, orienté Express, mal adapté au typage strict de Fastify.

### Décision Validée
- **Choix** : **Architecture de session maison Fastify avec `argon2`, `arctic` et stockage PostgreSQL**.
  - Cookie de session signé `session_id` (`HttpOnly`, `Secure` en production, `SameSite=Lax`, durée 30 jours si "Rester connecté", sinon session navigateur).
  - Validation des identifiants et payloads via schémas Zod.
  - `@fastify/rate-limit` pour limiter à 5 tentatives par minute sur `/api/auth/login` et `/api/auth/register`.
  - Service d'envoi d'emails encapsulé : transporteur Nodemailer/Mailhog/Inbucket en développement local, API Resend en production.

---

## 3. Stockage et Streaming Audio Compatible S3

### Contexte & Exigences
- Découplage strict : les fichiers binaires audio ne résident jamais dans PostgreSQL (seule la clé `s3Key` est persistée).
- Limite de 75 Mo par fichier aux formats MP3 et WAV, jusqu'à 3 instrus associables par texte.
- Environnement : MinIO en local via Docker Compose, Cloudflare R2 (ou AWS S3) en production.

### Approche Technique Validée
- **Téléversement direct via URLs présignées (Presigned PUT URLs)** :
  1. Le client demande une URL de téléversement : `POST /api/songs/:id/instrumentals/upload-url` avec le type MIME (`audio/mpeg`, `audio/wav`) et la taille.
  2. Le backend vérifie l'appartenance du texte à l'utilisateur, vérifie que le quota de 3 instrus n'est pas atteint, valide la taille $\le 75$ Mo, génère une clé S3 sécurisée (`users/{userId}/songs/{songId}/{uuid}.ext`) et signe une URL PUT temporaire (validité 5 minutes).
  3. Le client pousse le binaire directement vers le bucket S3/MinIO/R2 via l'URL signée.
  4. Le client confirme la fin du téléversement : `POST /api/songs/:id/instrumentals/confirm`.
- **Lecture et streaming** : URLs signées GET temporaires (ou streaming via proxy si nécessaire).
- **Client Web Audio** : Lecture via balise `<audio>` et `AudioContext` pour le bouclage précis de segment (start/end) et le métronome synchronisé.

---

## 4. Métrique Poétique & Détection des Rimes (Langue Française)

### Contexte & Exigences
- Compteur de syllabes par ligne et surlignage des rimes en couleur adapté aux spécificités de la langue française (diérèses, synérèses, 'e' caduc en fin de vers).
- Doit fonctionner côté client instantanément lors de la frappe.

### Approche Algorithmique Validée
- **Module autonome `packages/shared/lyrics-engine`** :
  1. *Comptage des syllabes* :
     - Algorithme de découpage phonético-graphique basé sur les groupes de voyelles (`[aàâeéèêëiîïoôuùûy]+`).
     - Règle poétique classique / moderne du rap : les 'e' muets en fin de ligne ne comptent pas ; les 'e' suivis d'une voyelle s'élident ; les 'e' suivis d'une consonne forment une syllabe sonore.
     - Option de comptage relâché (débit rap contemporain où les 'e' muets internes sont souvent élidés).
  2. *Coloration des rimes* :
     - Extraction des derniers phonèmes / lettres de chaque fin de vers (phonétique inversée simplifiée).
     - Regroupement des lignes partageant les mêmes terminaisons sonores (sons [o], [i], [a], [ɛ̃], etc.).
     - Attribution d'une palette de couleurs Tailwind pastel distinctes (`ring-amber`, `ring-emerald`, `ring-indigo`, `ring-rose`, etc.) pour identifier visuellement les schémas de rimes (suivies, croisées, embrassées).

---

## 5. Exportation PDF & Preuve d'Antériorité

### Contexte & Exigences
- Exportation propre d'un texte ou d'un album complet en PDF, incluant titre, artiste, date exacte et horodatage de la révision.
- Génération côté serveur pour garantir l'uniformité du document et ne pas charger le navigateur mobile.

### Décision Validée
- **Choix** : **`pdfkit` ou `@react-pdf/renderer` côté backend Fastify**.
- **Format du document** :
  - Mise en page minimaliste et élégante : typographie serif soignée, espacements aérés, filigrane discret "Certificat d'antériorité Verso".
  - En-tête : Titre de l'œuvre, Nom de plume de l'auteur, Identifiant unique de révision, Horodatage UTC certifié et date de dernière modification.
  - Corps : Paroles complètes avec numérotation des strophes / couplets / refrains.

---

## 6. Architecture PWA & Résilience Hors Ligne

### Contexte & Exigences
- Application installable sur smartphone (PWA).
- Écriture hors ligne sans aucune perte de texte.
- Synchronisation au retour du réseau avec résolution de conflit par création d'une copie `[Titre] (copie hors ligne)`.

### Décision Validée
- **Vite PWA (`vite-plugin-pwa`)** avec Service Worker configuré en stratégie `NetworkFirst` pour les appels d'API et `CacheFirst` pour les assets applicatifs.
- **Persistance locale via IndexedDB** (`idb` ou `dexie.js`) pour stocker les brouillons locaux et une file d'attente d'actions de synchronisation (`syncQueue`).
- **Protocole de synchronisation** :
  1. À chaque frappe, sauvegarde immédiate dans IndexedDB.
  2. Si en ligne : appel `PATCH /api/songs/:id` avec debounce 400 ms.
  3. Si hors ligne : marquage `isDirty: true` dans IndexedDB.
  4. Au retour de l'évènement `window.addEventListener('online')` : envoi de la version locale. Si le serveur répond avec un code `409 Conflict` (version distante modifiée entre-temps), le client déclenche automatiquement la création d'un nouveau texte intitulé `[Titre] (copie hors ligne)`.

---

## 7. Structure Monorepo & Outillage

### Décision Validée
- **Gestionnaire de paquets** : `pnpm workspaces` (ou `npm workspaces`) pour une gestion optimale du cache et des liens symboliques.
- **Arborescence** :
  - `apps/web` : Frontend React + Vite + Tailwind CSS + PWA.
  - `apps/api` : Backend Fastify + Prisma Client + Zod + Argon2 + Arctic.
  - `packages/shared` : Schémas Zod partagés, types TypeScript partagés, moteur d'analyse métrique (`lyrics-engine`).
- **Conteneurisation locale** : `docker-compose.yml` orchestrant PostgreSQL 16 et MinIO (avec création automatique du bucket `verso-audio`).
- **Tests & Qualité** : Vitest sur l'ensemble des modules, ESLint + Prettier configurés à la racine en politique zéro-warning.
