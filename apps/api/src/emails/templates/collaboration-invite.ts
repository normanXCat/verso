import {
  renderHeading,
  renderParagraph,
  renderBulletproofButton,
  renderInfoBox,
  renderFallbackLink,
  renderSecurityNote,
} from '../common/components.js';
import { renderEmailLayout } from '../common/layout.js';
import { renderTextLayout } from '../common/text-layout.js';
import { escapeHtml } from '../common/escape.js';

export type CollaboratorEmailRole = 'CO_AUTHOR' | 'COAUTHOR' | 'COMMENTER' | 'READER' | 'VIEWER';

export interface CollaborationInviteEmailProps {
  inviterName: string;
  targetTitle: string;
  targetType: 'song' | 'album';
  role: CollaboratorEmailRole;
  rawToken: string;
  expiresAt?: Date;
  clientUrl: string;
  assetsUrl: string;
  replyToEmail?: string;
  showBanner?: boolean;
}

const ROLE_LABELS: Record<string, { label: string; desc: string }> = {
  CO_AUTHOR: {
    label: 'Co-auteur',
    desc: 'écriture, modification des paroles et gestion des versions',
  },
  COAUTHOR: {
    label: 'Co-auteur',
    desc: 'écriture, modification des paroles et gestion des versions',
  },
  COMMENTER: {
    label: 'Commentateur',
    desc: 'lecture et ajout de retours ciblés sur les vers',
  },
  READER: {
    label: 'Lecteur',
    desc: 'lecture seule de l’œuvre',
  },
  VIEWER: {
    label: 'Lecteur',
    desc: 'lecture seule de l’œuvre',
  },
};

export function buildCollaborationInviteEmail(props: CollaborationInviteEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const inviterSafeName = props.inviterName.trim() || 'Un collaborateur';
  const targetTypeLabel = props.targetType === 'album' ? 'l’album' : 'le texte';
  const roleInfo = ROLE_LABELS[props.role] || ROLE_LABELS.COAUTHOR;

  const subject = `${inviterSafeName} t’invite à collaborer sur « ${props.targetTitle} » — Verso`;
  const preheader = `${inviterSafeName} t’invite à collaborer sur Verso.`;

  const acceptUrl = `${props.clientUrl.replace(/\/$/, '')}/invitations/${encodeURIComponent(props.rawToken)}`;
  const listUrl = `${props.clientUrl.replace(/\/$/, '')}/invitations`;

  const expirationText = props.expiresAt
    ? `Expire le ${props.expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
    : 'Expire dans 7 jours';

  const detailsHtml = `
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
      <tr>
        <td style="padding: 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #9A9183;">
          Projet : <strong style="color: #EDE6D8;">« ${escapeHtml(props.targetTitle)} »</strong> (${escapeHtml(targetTypeLabel)})
        </td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #9A9183;">
          Auteur de l'invitation : <strong style="color: #EDE6D8;">${escapeHtml(inviterSafeName)}</strong>
        </td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #9A9183;">
          Rôle proposé : <strong style="color: #FF5A2E;">${escapeHtml(roleInfo.label)}</strong> (${escapeHtml(roleInfo.desc)})
        </td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #7A7266;">
          Délai : ${escapeHtml(expirationText)}
        </td>
      </tr>
    </table>
  `;

  const htmlContent = [
    renderHeading('Nouvelle invitation à collaborer'),
    renderParagraph(
      `${inviterSafeName} t’a invité à rejoindre ${targetTypeLabel} « ${props.targetTitle} » avec le rôle de ${roleInfo.label}.`,
    ),
    renderInfoBox(detailsHtml, { title: 'Détails de l’invitation :' }),
    renderBulletproofButton({
      text: 'Accepter l’invitation',
      url: acceptUrl,
      variant: 'primary',
    }),
    renderBulletproofButton({
      text: 'Voir toutes mes invitations',
      url: listUrl,
      variant: 'secondary',
    }),
    renderFallbackLink(acceptUrl, `${expirationText} et ne fonctionne qu’une seule fois.`),
    renderSecurityNote(
      'Tu n’as pas encore de carnet Verso ? Ce lien te permettra de créer ton compte et de rejoindre directement le projet.',
    ),
  ].join('');

  const html = renderEmailLayout(htmlContent, {
    subject,
    preheader,
    clientUrl: props.clientUrl,
    assetsUrl: props.assetsUrl,
    replyToEmail: props.replyToEmail,
    reason: 'Tu reçois cet email parce qu’un auteur Verso a partagé une invitation avec toi.',
    showBanner: props.showBanner,
  });

  const textBody = [
    'Nouvelle invitation à collaborer',
    '',
    `${inviterSafeName} t’a invité à rejoindre ${targetTypeLabel} « ${props.targetTitle} » avec le rôle de ${roleInfo.label}.`,
    '',
    `• Projet : « ${props.targetTitle} » (${targetTypeLabel})`,
    `• Rôle : ${roleInfo.label} (${roleInfo.desc})`,
    `• ${expirationText}`,
    '',
    `Lien direct pour accepter l'invitation : ${acceptUrl}`,
    `Ou consulte toutes tes invitations sur : ${listUrl}`,
    '',
    'Tu n’as pas encore de compte Verso ? Ce lien te permettra d’activer ton compte et d’accéder directement au texte.',
  ].join('\n');

  const text = renderTextLayout(textBody, {
    subject,
    clientUrl: props.clientUrl,
    replyToEmail: props.replyToEmail,
    reason: 'Tu reçois cet email parce qu’un auteur Verso a partagé une invitation avec toi.',
  });

  return { subject, html, text };
}
