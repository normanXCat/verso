import {
  renderHeading,
  renderParagraph,
  renderBulletproofButton,
  renderInfoBox,
  renderSecurityNote,
} from '../common/components.js';
import { renderEmailLayout } from '../common/layout.js';
import { renderTextLayout } from '../common/text-layout.js';
import { escapeHtml } from '../common/escape.js';

export interface PasswordChangedEmailProps {
  displayName?: string | null;
  changedAt?: Date;
  deviceInfo?: string;
  clientUrl: string;
  assetsUrl: string;
  replyToEmail?: string;
  showBanner?: boolean;
}

export function buildPasswordChangedEmail(props: PasswordChangedEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Sécurité : mot de passe mis à jour — Verso';
  const preheader = 'Ton mot de passe Verso vient d’être modifié.';
  const securityUrl = `${props.clientUrl.replace(/\/$/, '')}/forgot-password`;

  const dateStr = (props.changedAt ?? new Date()).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });

  const deviceText = props.deviceInfo || 'Navigateur web';

  const detailsHtml = `
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
      <tr>
        <td style="padding: 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #9A9183;">
          Date et heure : <strong style="color: #EDE6D8;">${escapeHtml(dateStr)}</strong>
        </td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #9A9183;">
          Appareil : <strong style="color: #EDE6D8;">${escapeHtml(deviceText)}</strong>
        </td>
      </tr>
    </table>
  `;

  const htmlContent = [
    renderHeading('Mot de passe mis à jour'),
    renderParagraph(
      `Le mot de passe de ton compte Verso a été modifié avec succès. Toutes tes sessions actives ont été automatiquement déconnectées par précaution.`,
    ),
    renderInfoBox(detailsHtml, { title: 'Détails de l’opération :' }),
    renderParagraph(
      'Si tu es à l’origine de ce changement, aucune action supplémentaire n’est requise.',
      { secondary: true },
    ),
    renderParagraph(
      'Si tu n’as pas effectué cette modification, ton compte est peut-être compromis. Clique ci-dessous pour déclencher immédiatement une réinitialisation de sécurité :',
    ),
    renderBulletproofButton({
      text: 'Ce n’était pas moi — Sécuriser mon compte',
      url: securityUrl,
      variant: 'secondary',
    }),
    renderSecurityNote(
      'Tu peux également nous contacter immédiatement en répondant directement à cet email.',
    ),
  ].join('');

  const html = renderEmailLayout(htmlContent, {
    subject,
    preheader,
    clientUrl: props.clientUrl,
    assetsUrl: props.assetsUrl,
    replyToEmail: props.replyToEmail,
    reason: 'Notification de sécurité automatique liée à ton compte Verso.',
    showBanner: props.showBanner,
  });

  const textBody = [
    'Mot de passe mis à jour',
    '',
    `Le mot de passe de ton compte Verso a été modifié avec succès le ${dateStr} (${deviceText}).`,
    'Toutes tes autres sessions ont été déconnectées par mesure de sécurité.',
    '',
    'Si tu es à l’origine de ce changement, tu n’as rien de plus à faire.',
    '',
    'Si ce n’était pas toi, sécurise ton compte immédiatement :',
    securityUrl,
  ].join('\n');

  const text = renderTextLayout(textBody, {
    subject,
    clientUrl: props.clientUrl,
    replyToEmail: props.replyToEmail,
    reason: 'Notification de sécurité automatique liée à ton compte Verso.',
  });

  return { subject, html, text };
}
