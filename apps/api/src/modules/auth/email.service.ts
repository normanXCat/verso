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
 * Mode de remise d'un email selon l'environnement.
 * - `sent` : un transport est configuré (Resend), l'email part réellement.
 * - `simulated` : aucun transport, hors production — l'email est affiché dans la console.
 * - `blocked` : aucune configuration en production — l'email n'est pas envoyé et son
 *   contenu (donc le lien de vérification) ne doit jamais être journalisé.
 */
export type EmailDelivery = 'sent' | 'simulated' | 'blocked';

export function resolveEmailDelivery(nodeEnv: string, hasTransport: boolean): EmailDelivery {
  if (hasTransport) {
    return 'sent';
  }
  return nodeEnv === 'production' ? 'blocked' : 'simulated';
}

/**
 * Met en forme l'email simulé affiché en développement : en-têtes lisibles et contenu
 * intégral, lien de vérification compris, pour tester le parcours sans Docker ni SMTP.
 */
export function formatSimulatedEmail({
  from,
  to,
  subject,
  text,
}: {
  from: string;
  to: string;
  subject: string;
  text: string;
}): string {
  return [
    '',
    '══════════ Verso · EMAIL SIMULÉ (développement) ══════════',
    "Aucun transport d'email configuré (RESEND_API_KEY absente).",
    `De     : ${from}`,
    `À      : ${to}`,
    `Objet  : ${subject}`,
    '─────────────────────────────────────────────────────────',
    text,
    '═════════════════════════════════════════════════════════',
    '',
  ].join('\n');
}

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

  const delivery = resolveEmailDelivery(env.NODE_ENV, Boolean(env.RESEND_API_KEY));

  // Configuration d'envoi absente alors qu'on est en production : on n'écrit JAMAIS le
  // contenu de l'email (donc jamais le lien de vérification) dans les journaux.
  if (delivery === 'blocked') {
    console.error(
      "[EmailService] Aucun transport d'email configuré (RESEND_API_KEY absente) : email non envoyé.",
    );
    return false;
  }

  // Développement local sans Docker ni serveur SMTP : l'email complet (contenu et lien
  // inclus) est affiché dans la console pour pouvoir tester le parcours de bout en bout.
  // Le mode test reste silencieux.
  if (delivery === 'simulated') {
    if (env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log(formatSimulatedEmail({ from: env.EMAIL_FROM, to, subject, text }));
    }
    return true;
  }

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
