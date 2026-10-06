import { AuthApiError } from './auth-client.js';

export interface PresentedAuthError {
  /** Message principal, compréhensible par l'utilisateur. */
  message: string;
  /** Détail éventuel par champ (erreurs de validation 400). */
  details: string[];
  /** Indique si un nouvel essai a du sens (erreur temporaire). */
  retryable: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  email: 'Adresse email',
  password: 'Mot de passe',
  newPassword: 'Nouveau mot de passe',
  displayName: "Nom d'artiste",
  token: 'Lien',
};

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

/** Extrait le détail par champ d'un `flatten()` Zod renvoyé par l'API. */
function extractFieldDetails(errors: unknown): string[] {
  if (!errors || typeof errors !== 'object') {
    return [];
  }
  const { fieldErrors, formErrors } = errors as {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
  const details: string[] = [];

  if (fieldErrors) {
    for (const [field, messages] of Object.entries(fieldErrors)) {
      for (const message of messages) {
        details.push(`${fieldLabel(field)} : ${message}`);
      }
    }
  }
  if (formErrors) {
    details.push(...formErrors);
  }
  return details;
}

/**
 * Transforme une erreur quelconque en message français destiné à l'interface.
 * Ne montre jamais le message brut du serveur pour les erreurs 5xx (aucune fuite).
 */
export function presentAuthError(error: unknown): PresentedAuthError {
  if (!(error instanceof AuthApiError)) {
    return {
      message: 'Une erreur inattendue est survenue. Réessaie dans un instant.',
      details: [],
      retryable: true,
    };
  }

  switch (error.statusCode) {
    case 0:
      return {
        message: 'Impossible de joindre le serveur. Vérifie ta connexion.',
        details: [],
        retryable: true,
      };
    case 400:
      return {
        message: 'Certains champs sont invalides.',
        details: extractFieldDetails(error.errors),
        retryable: false,
      };
    case 401:
      return {
        message: 'Adresse email ou mot de passe incorrect.',
        details: [],
        retryable: false,
      };
    case 403:
      return {
        message: 'Requête bloquée pour des raisons de sécurité. Recharge la page puis réessaie.',
        details: [],
        retryable: true,
      };
    case 404:
      return { message: 'Élément introuvable.', details: [], retryable: false };
    case 409:
      return {
        message: 'Un compte existe déjà avec cette adresse email.',
        details: [],
        retryable: false,
      };
    case 429: {
      const seconds = error.retryAfterSeconds ?? 60;
      const minutes = Math.max(1, Math.ceil(seconds / 60));
      return {
        message: `Trop de tentatives, réessaie dans ${minutes} minute${minutes > 1 ? 's' : ''}.`,
        details: [],
        retryable: true,
      };
    }
    default:
      if (error.statusCode >= 500) {
        return {
          message: 'Un problème est survenu de notre côté. Réessaie dans un instant.',
          details: [],
          retryable: true,
        };
      }
      return {
        message: error.message || 'Une erreur est survenue.',
        details: extractFieldDetails(error.errors),
        retryable: false,
      };
  }
}
