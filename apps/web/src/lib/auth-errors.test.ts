import { describe, expect, it } from 'vitest';
import { AuthApiError } from './auth-client.js';
import { presentAuthError } from './auth-errors.js';

describe('presentAuthError', () => {
  it('affiche un message générique et les détails par champ pour un 400', () => {
    const error = new AuthApiError('Données invalides', 400, {
      fieldErrors: { email: ['Adresse email invalide'] },
      formErrors: [],
    });

    const presented = presentAuthError(error);
    expect(presented.message).toBe('Certains champs sont invalides.');
    expect(presented.retryable).toBe(false);
    expect(presented.details).toContain('Adresse email : Adresse email invalide');
  });

  it('indique le délai d’attente pour un 429', () => {
    const presented = presentAuthError(new AuthApiError('Too many', 429, undefined, 90));
    expect(presented.message).toBe('Trop de tentatives, réessaie dans 2 minutes.');
    expect(presented.retryable).toBe(true);
  });

  it('ne divulgue aucun message brut pour une erreur serveur (500)', () => {
    const error = new AuthApiError('Invalid prisma.user invocation token=abc', 500);
    const presented = presentAuthError(error);
    expect(presented.message).toBe(
      'Un problème est survenu de notre côté. Réessaie dans un instant.',
    );
    expect(presented.retryable).toBe(true);
    expect(presented.message).not.toContain('prisma');
    expect(presented.message).not.toContain('abc');
  });

  it('signale une coupure réseau (statut 0)', () => {
    const presented = presentAuthError(new AuthApiError('Impossible de joindre le serveur', 0));
    expect(presented.message).toBe('Impossible de joindre le serveur. Vérifie ta connexion.');
    expect(presented.retryable).toBe(true);
  });

  it('renvoie un message générique pour une erreur inconnue', () => {
    const presented = presentAuthError(new Error('boom'));
    expect(presented.message).toContain('erreur inattendue');
    expect(presented.retryable).toBe(true);
  });
});
