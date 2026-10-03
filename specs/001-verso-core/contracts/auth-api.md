# Contrats d'API REST: Authentification & Sessions

Base path: `/api/auth`

---

## 1. `POST /api/auth/register`
Création d'un nouveau compte utilisateur par email et mot de passe.

### Entrée (Requête)
```json
{
  "email": "artiste@verso.fr",
  "password": "Password123!",
  "displayName": "MC Plume"
}
```
*Validation Zod :*
- `email`: email valide, max 255 car., converti en minuscules.
- `password`: min 8 car., min 1 chiffre, min 1 majuscule, min 1 caractère spécial.
- `displayName`: optionnel, chaîne épurée max 50 car.

### Sortie (Réponse)
- **Code 201 Created** :
  - Cookie de session positionné : `Set-Cookie: session_id=...; HttpOnly; Secure; SameSite=Lax; Path=/`
  - Corps de réponse :
  ```json
  {
    "user": {
      "id": "uuid-...",
      "email": "artiste@verso.fr",
      "displayName": "MC Plume",
      "emailVerified": null
    },
    "message": "Compte créé avec succès. Un lien de vérification a été envoyé par email."
  }
  ```
- **Code 400 Bad Request** : Erreur de validation Zod.
- **Code 409 Conflict** : `"Un compte existe déjà avec cette adresse email"` (ou message générique selon configuration de confidentialité).
- **Code 429 Too Many Requests** : Rate limiting dépassé (max 5 tentatives / minute).

---

## 2. `POST /api/auth/login`
Connexion par email et mot de passe.

### Entrée
```json
{
  "email": "artiste@verso.fr",
  "password": "Password123!",
  "rememberMe": true
}
```

### Sortie
- **Code 200 OK** :
  - Cookie de session positionné (durée 30 jours si `rememberMe: true`, sinon session de navigateur).
  ```json
  {
    "user": {
      "id": "uuid-...",
      "email": "artiste@verso.fr",
      "displayName": "MC Plume",
      "emailVerified": "2026-10-03T12:00:00Z"
    }
  }
  ```
- **Code 401 Unauthorized** : `"Identifiants incorrects"` (message générique protégeant contre l'énumération d'adresses).
- **Code 429 Too Many Requests** : Rate limiting dépassé.

---

## 3. `POST /api/auth/logout`
Fermeture de la session courante.

### Sortie
- **Code 200 OK** : Session supprimée en base de données, cookie invalidé (`Max-Age=0`).
```json
{
  "message": "Déconnexion réussie."
}
```

---

## 4. `GET /api/auth/verify-email?token=...`
Validation de l'adresse email par lien unique.

### Sortie
- **Code 200 OK** :
```json
{
  "message": "Votre adresse email a été vérifiée avec succès."
}
```
- **Code 400 Bad Request** : Token invalide, expiré ou déjà utilisé.

---

## 5. `POST /api/auth/forgot-password`
Demande de réinitialisation de mot de passe.

### Entrée
```json
{
  "email": "artiste@verso.fr"
}
```

### Sortie
- **Code 200 OK** : Réponse générique quel que soit l'état de l'adresse en base :
```json
{
  "message": "Si cette adresse existe, un email contenant un lien temporaire a été envoyé."
}
```

---

## 6. `POST /api/auth/reset-password`
Validation du nouveau mot de passe avec le token de réinitialisation.

### Entrée
```json
{
  "token": "token-secret-recu-par-email",
  "newPassword": "NewPassword123!"
}
```

### Sortie
- **Code 200 OK** : Mot de passe mis à jour (Argon2id), révocation de toutes les sessions actives par sécurité.
```json
{
  "message": "Votre mot de passe a été mis à jour. Veuillez vous reconnecter."
}
```

---

## 7. `GET /api/auth/sessions` & `DELETE /api/auth/sessions/:id`
Gestion et révocation des sessions actives.

### `GET /api/auth/sessions`
- **Code 200 OK** :
```json
[
  {
    "id": "session-1",
    "isCurrent": true,
    "userAgent": "Mozilla/5.0 ... Mobile",
    "ipAddress": "192.168.1.10",
    "createdAt": "2026-10-03T10:00:00Z",
    "lastActiveAt": "2026-10-03T14:30:00Z"
  }
]
```

### `DELETE /api/auth/sessions/:id`
Révocation d'une session distante spécifique.
- **Code 200 OK** : Session révoquée.

### `DELETE /api/auth/sessions` (Query: `?allExceptCurrent=true`)
Révocation de toutes les sessions distantes sauf la courante.

---

## 8. Flux OAuth (Google & ORCID avec PKCE & Liaison Sécurisée)

### `GET /api/auth/oauth/:provider` (`google` ou `orcid`)
Initialise le flux OAuth avec génération de `state` cryptographique et code verifier / challenge PKCE stockés en cookie temporaire sécurisé. Redirige vers le fournisseur tiers.

### `GET /api/auth/oauth/:provider/callback`
Reçoit le `code` et vérifie le `state`.
- **Cas 1** : Compte OAuth déjà associé $\rightarrow$ Connexion immédiate, cookie de session émis.
- **Cas 2** : Aucun compte existant $\rightarrow$ Création du compte utilisateur et de la liaison, connexion immédiate.
- **Cas 3** : Un compte email/mot de passe existe déjà avec cet email $\rightarrow$ Le serveur renvoie un statut `409 Conflict` avec un jeton temporaire de liaison `linkToken` et invite le frontend à demander le mot de passe du compte existant.

### `POST /api/auth/oauth/link-confirm`
Confirmation de la liaison du compte OAuth après saisie du mot de passe existant :
```json
{
  "linkToken": "jwt-or-hash-temporaire",
  "password": "PasswordDuCompteExistant123!"
}
```
Sortie : Liaison créée et session ouverte avec succès.
