import { describe, expect, it, beforeEach } from 'vitest';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  getSentEmailsForTesting,
  clearSentEmailsForTesting,
  resolveEmailDelivery,
  formatSimulatedEmail,
} from '../../src/modules/auth/email.service.js';

describe("Service d'emails transactionnels (email.service)", () => {
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

describe("Choix du mode de remise selon l'environnement", () => {
  it("simule l'envoi hors production quand aucun transport n'est configuré", () => {
    expect(resolveEmailDelivery('development', false)).toBe('simulated');
    expect(resolveEmailDelivery('test', false)).toBe('simulated');
  });

  it("bloque l'envoi en production quand aucun transport n'est configuré", () => {
    expect(resolveEmailDelivery('production', false)).toBe('blocked');
  });

  it("envoie réellement dès qu'un transport est configuré", () => {
    expect(resolveEmailDelivery('production', true)).toBe('sent');
    expect(resolveEmailDelivery('development', true)).toBe('sent');
  });
});

describe("Aperçu de l'email simulé en développement", () => {
  beforeEach(() => {
    clearSentEmailsForTesting();
  });

  it("affiche l'email complet, lien de vérification inclus", async () => {
    await sendVerificationEmail('artiste@verso.fr', 'token-preview-42');
    const [sent] = getSentEmailsForTesting();

    const preview = formatSimulatedEmail({
      from: 'Verso <noreply@verso.fr>',
      to: sent.to,
      subject: sent.subject,
      text: sent.text,
    });

    expect(preview).toContain('EMAIL SIMULÉ');
    expect(preview).toContain('artiste@verso.fr');
    expect(preview).toContain('Vérifiez votre adresse email');
    expect(preview).toContain('/verify-email?token=token-preview-42');
    expect(preview).not.toContain('undefined');
  });
});
