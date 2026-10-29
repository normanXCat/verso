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

export interface NotificationActivityItem {
  actorName?: string | null;
  targetTitle?: string | null;
  type: string;
  message?: string;
}

export interface ActivityNotificationEmailProps {
  displayName?: string | null;
  items: NotificationActivityItem[];
  clientUrl: string;
  assetsUrl: string;
  replyToEmail?: string;
  showBanner?: boolean;
}

function formatNotificationLine(item: NotificationActivityItem): string {
  const actor = item.actorName?.trim() || 'Un collaborateur';
  const target = item.targetTitle ? ` sur « ${item.targetTitle} »` : '';

  switch (item.type) {
    case 'INVITATION_RECEIVED':
      return `${actor} t’a invité à collaborer${target}.`;
    case 'MENTION':
      return `${actor} t’a mentionné dans une discussion${target}.`;
    case 'COMMENT_ADDED':
      return `${actor} a laissé un nouveau commentaire${target}.`;
    case 'COMMENT_REPLY':
      return `${actor} a répondu à ton commentaire${target}.`;
    default:
      return item.message || `Nouvelle activité de ${actor}${target}.`;
  }
}

export function buildActivityNotificationEmail(props: ActivityNotificationEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const count = props.items.length;
  const subject =
    count === 1
      ? 'Nouvelle notification collaborative — Verso'
      : `Tu as ${count} nouvelles notifications — Verso`;
  const preheader = 'Activité récente sur tes projets dans Verso.';
  const appUrl = `${props.clientUrl.replace(/\/$/, '')}/app`;

  const greetingName = props.displayName ? `, ${props.displayName}` : '';
  const headingText = `Activité récente${greetingName}`;

  const formattedLines = props.items.map(formatNotificationLine);

  const itemsHtml = `
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
      ${formattedLines
        .map(
          (line) => `
        <tr>
          <td valign="top" style="padding: 6px 10px 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #FF5A2E; line-height: 1.5; font-weight: bold; width: 14px;">
            •
          </td>
          <td valign="top" style="padding: 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.5; color: #EDE6D8;">
            ${escapeHtml(line)}
          </td>
        </tr>
      `,
        )
        .join('')}
    </table>
  `;

  const htmlContent = [
    renderHeading(headingText),
    renderParagraph(
      'Voici le récapitulatif des dernières interactions et retours sur tes textes et albums :',
    ),
    renderInfoBox(itemsHtml, { title: 'Derniers retours :' }),
    renderBulletproofButton({
      text: 'Consulter dans Verso',
      url: appUrl,
    }),
    renderSecurityNote(
      'Tu peux ajuster la fréquence de ces alertes à tout moment dans tes paramètres de notification.',
    ),
  ].join('');

  const html = renderEmailLayout(htmlContent, {
    subject,
    preheader,
    clientUrl: props.clientUrl,
    assetsUrl: props.assetsUrl,
    replyToEmail: props.replyToEmail,
    reason: 'Tu reçois cet email selon tes préférences de notifications configurées sur Verso.',
    showBanner: props.showBanner,
  });

  const textBody = [
    headingText,
    '',
    'Voici le récapitulatif des dernières interactions sur tes textes :',
    '',
    ...formattedLines.map((line) => `• ${line}`),
    '',
    `Consulter dans Verso : ${appUrl}`,
  ].join('\n');

  const text = renderTextLayout(textBody, {
    subject,
    clientUrl: props.clientUrl,
    replyToEmail: props.replyToEmail,
    reason: 'Tu reçois cet email selon tes préférences de notifications configurées sur Verso.',
  });

  return { subject, html, text };
}
