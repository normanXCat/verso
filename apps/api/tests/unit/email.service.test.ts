import { describe, expect, it, beforeEach } from 'vitest';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  getSentEmailsForTesting,
  clearSentEmailsForTesting,
} from '../../src/modules/auth/email.service.js';

describe('Service d\'emails transactionnels (email.service)', () => {
  beforeEach(() => {
    clearSentEmailsForTesting();
  });

  it('doit générer et journaliser un email de vérification avec le lien adéquat', async () => {
    const rawToken = 'test-token-123456';
    const ok = await sendVerificationEmail('artiste@verso.fr', rawToken);

    expect(ok).toBe(true);
    const sent = getSentEmailsForTesting();
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('artiste@verso.fr');
    expect(sent[0].subject).toContain('Vérifiez votre adresse');
    expect(sent[0].text).toContain(rawToken);
    expect(sent[0].text).toContain('/verify-email?token=');
  });

  it('doit générer et journaliser un email de réinitialisation de mot de passe', async () => {
    const rawToken = 'reset-token-987654';
    const ok = await sendPasswordResetEmail('reset@verso.fr', rawToken);

    expect(ok).toBe(true);
    const sent = getSentEmailsForTesting();
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('reset@verso.fr');
    expect(sent[0].subject).toContain('Réinitialisation');
    expect(sent[0].text).toContain(rawToken);
    expect(sent[0].text).toContain('/reset-password?token=');
  });
});
