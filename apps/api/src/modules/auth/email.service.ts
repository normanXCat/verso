import { env } from '../../config/env.js';
import { redactSecrets } from '../../plugins/error-handler.js';
import {
  buildVerificationEmail,
  buildWelcomeEmail,
  buildForgotPasswordEmail,
  buildPasswordChangedEmail,
  buildCollaborationInviteEmail,
  buildActivityNotificationEmail,
  type NotificationActivityItem,
  type CollaboratorEmailRole,
} from '../../emails/index.js';

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
export async function sendVerificationEmail(
  to: string,
  rawToken: string,
  displayName?: string | null,
): Promise<boolean> {
  if (env.NODE_ENV === 'production' && env.CLIENT_URL.includes('localhost')) {
    console.warn(
      '[EmailService] Attention : CLIENT_URL pointe vers localhost en environnement de production !',
    );
  }
  const { subject, html, text } = buildVerificationEmail({
    displayName,
    rawToken,
    clientUrl: env.CLIENT_URL,
    assetsUrl: env.EMAIL_ASSETS_URL,
    replyToEmail: env.EMAIL_REPLY_TO,
    showBanner: true,
  });

  return sendEmail({ to, subject, text, html });
}

/**
 * Envoie un email de bienvenue une fois l'adresse confirmée.
 */
export async function sendWelcomeEmail(to: string, displayName?: string | null): Promise<boolean> {
  const { subject, html, text } = buildWelcomeEmail({
    displayName,
    clientUrl: env.CLIENT_URL,
    assetsUrl: env.EMAIL_ASSETS_URL,
    replyToEmail: env.EMAIL_REPLY_TO,
    showBanner: true,
  });

  return sendEmail({ to, subject, text, html });
}

/**
 * Envoie un email de réinitialisation de mot de passe avec le token brut.
 */
export async function sendPasswordResetEmail(
  to: string,
  rawToken: string,
  displayName?: string | null,
): Promise<boolean> {
  const { subject, html, text } = buildForgotPasswordEmail({
    displayName,
    rawToken,
    clientUrl: env.CLIENT_URL,
    assetsUrl: env.EMAIL_ASSETS_URL,
    replyToEmail: env.EMAIL_REPLY_TO,
    showBanner: false,
  });

  return sendEmail({ to, subject, text, html });
}

/**
 * Envoie un email de confirmation après modification réussie du mot de passe.
 */
export async function sendPasswordChangedEmail(
  to: string,
  options?: {
    displayName?: string | null;
    changedAt?: Date;
    deviceInfo?: string;
  },
): Promise<boolean> {
  const { subject, html, text } = buildPasswordChangedEmail({
    displayName: options?.displayName,
    changedAt: options?.changedAt,
    deviceInfo: options?.deviceInfo,
    clientUrl: env.CLIENT_URL,
    assetsUrl: env.EMAIL_ASSETS_URL,
    replyToEmail: env.EMAIL_REPLY_TO,
    showBanner: false,
  });

  return sendEmail({ to, subject, text, html });
}

/**
 * Envoie un email d'invitation à collaborer sur un texte ou un album.
 */
export async function sendCollaborationInviteEmail(
  to: string,
  options: {
    inviterName: string;
    targetTitle: string;
    targetType: 'song' | 'album';
    role: CollaboratorEmailRole;
    rawToken: string;
    expiresAt?: Date;
  },
): Promise<boolean> {
  const { subject, html, text } = buildCollaborationInviteEmail({
    inviterName: options.inviterName,
    targetTitle: options.targetTitle,
    targetType: options.targetType,
    role: options.role,
    rawToken: options.rawToken,
    expiresAt: options.expiresAt,
    clientUrl: env.CLIENT_URL,
    assetsUrl: env.EMAIL_ASSETS_URL,
    replyToEmail: env.EMAIL_REPLY_TO,
    showBanner: false,
  });

  return sendEmail({ to, subject, text, html });
}

/**
 * Envoie un email de notification ou résumé d'activité collaborative.
 */
export async function sendNotificationEmail({
  to,
  subject: customSubject,
  text: customText,
  html: customHtml,
  items,
  displayName,
}: {
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  items?: NotificationActivityItem[];
  displayName?: string | null;
}): Promise<boolean> {
  if (items && items.length > 0) {
    const generated = buildActivityNotificationEmail({
      displayName,
      items,
      clientUrl: env.CLIENT_URL,
      assetsUrl: env.EMAIL_ASSETS_URL,
      replyToEmail: env.EMAIL_REPLY_TO,
      showBanner: false,
    });
    return sendEmail({
      to,
      subject: generated.subject,
      text: generated.text,
      html: generated.html,
    });
  }

  const subject = customSubject || 'Activité sur Verso';
  const text = customText || '';
  const html =
    customHtml ||
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Activité sur Verso</h2>
      <p style="white-space: pre-line;">${text}</p>
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

  const resendApiKey = env.RESEND_API_KEY?.trim();
  const delivery = resolveEmailDelivery(env.NODE_ENV, Boolean(resendApiKey));

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
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [to],
        subject,
        text,
        html,
        ...(env.EMAIL_REPLY_TO ? { reply_to: env.EMAIL_REPLY_TO } : {}),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        `[EmailService] Échec de l'envoi via Resend (${response.status}) :`,
        redactSecrets(JSON.stringify(errorData)),
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "[EmailService] Erreur réseau lors de l'appel à Resend :",
      redactSecrets(error instanceof Error ? error.message : String(error)),
    );
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
