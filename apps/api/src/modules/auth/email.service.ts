import { env } from '../../config/env.js';

export interface SentEmail {
  to: string;
  subject: string;
  text: string;
  html?: string;
  sentAt: Date;
}

const sentEmailsHistory: SentEmail[] = [];

/**
 * Envoie un email de vérification d'adresse avec le lien contenant le token brut.
 */
export async function sendVerificationEmail(to: string, rawToken: string): Promise<boolean> {
  const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${encodeURIComponent(rawToken)}`;
  const subject = 'Vérifiez votre adresse email — Verso';
  const text = `Bienvenue sur Verso !\n\nCliquez sur le lien suivant pour vérifier votre adresse email :\n${verificationUrl}\n\nCe lien expire dans 24 heures.\n\nL'équipe Verso`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Bienvenue sur Verso</h2>
      <p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse email :</p>
      <p style="margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Vérifier mon adresse email
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">Ou copiez ce lien dans votre navigateur : ${verificationUrl}</p>
      <p style="color: #999; font-size: 12px;">Ce lien expire dans 24 heures.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}

/**
 * Envoie un email de réinitialisation de mot de passe avec le token brut.
 */
export async function sendPasswordResetEmail(to: string, rawToken: string): Promise<boolean> {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const subject = 'Réinitialisation de votre mot de passe — Verso';
  const text = `Vous avez demandé la réinitialisation de votre mot de passe sur Verso.\n\nCliquez sur ce lien pour en définir un nouveau :\n${resetUrl}\n\nCe lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.\n\nL'équipe Verso`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Réinitialisation de mot de passe</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe Verso :</p>
      <p style="margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Changer mon mot de passe
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">Ou copiez ce lien dans votre navigateur : ${resetUrl}</p>
      <p style="color: #999; font-size: 12px;">Ce lien expire dans 1 heure.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}

/**
 * Envoie un email via l'API Resend ou le journalise en développement/test.
 */
async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<boolean> {
  const emailRecord: SentEmail = {
    to,
    subject,
    text,
    html,
    sentAt: new Date(),
  };

  sentEmailsHistory.push(emailRecord);

  if (env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: [to],
          subject,
          text,
          html,
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  // Mode local ou test
  if (env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.log(`[EmailService] Simulation d'envoi à ${to}: "${subject}"`);
  }

  return true;
}

/**
 * Récupère l'historique des emails simulés (utile pour les assertions de tests).
 */
export function getSentEmailsForTesting(): SentEmail[] {
  return [...sentEmailsHistory];
}

/**
 * Réinitialise l'historique des emails de test.
 */
export function clearSentEmailsForTesting(): void {
  sentEmailsHistory.length = 0;
}
