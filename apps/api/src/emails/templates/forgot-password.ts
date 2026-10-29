import {
  renderHeading,
  renderParagraph,
  renderBulletproofButton,
  renderFallbackLink,
  renderSecurityNote,
} from '../common/components.js';
import { renderEmailLayout } from '../common/layout.js';
import { renderTextLayout } from '../common/text-layout.js';

export interface ForgotPasswordEmailProps {
  displayName?: string | null;
  rawToken: string;
  clientUrl: string;
  assetsUrl: string;
  replyToEmail?: string;
  showBanner?: boolean;
}

export function buildForgotPasswordEmail(props: ForgotPasswordEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Réinitialisation de ton mot de passe — Verso';
  const preheader = 'Lien temporaire pour choisir un nouveau mot de passe.';
  const resetUrl = `${props.clientUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(props.rawToken)}`;

  const htmlContent = [
    renderHeading('Changer de mot de passe'),
    renderParagraph(
      'Tu as demandé la réinitialisation de ton mot de passe sur Verso. Clique sur le bouton ci-dessous pour en choisir un nouveau.',
    ),
    renderBulletproofButton({
      text: 'Choisir un nouveau mot de passe',
      url: resetUrl,
    }),
    renderFallbackLink(resetUrl, 'Ce lien expire dans 1 heure et ne fonctionne qu’une seule fois.'),
    renderSecurityNote(
      'Si ce n’est pas toi qui as fait cette demande, ignore simplement ce message : ton mot de passe ne changera pas et ton compte reste parfaitement sécurisé.',
    ),
  ].join('');

  const html = renderEmailLayout(htmlContent, {
    subject,
    preheader,
    clientUrl: props.clientUrl,
    assetsUrl: props.assetsUrl,
    replyToEmail: props.replyToEmail,
    reason: 'Tu reçois cet email suite à une demande de réinitialisation de mot de passe.',
    showBanner: props.showBanner,
  });

  const textBody = [
    'Changer de mot de passe',
    '',
    'Tu as demandé la réinitialisation de ton mot de passe sur Verso.',
    '',
    `Lien de réinitialisation : ${resetUrl}`,
    '(Ce lien expire dans 1 heure et ne fonctionne qu’une seule fois)',
    '',
    'Si ce n’est pas toi, ignore ce message : ton mot de passe ne changera pas et ton compte reste protégé.',
  ].join('\n');

  const text = renderTextLayout(textBody, {
    subject,
    clientUrl: props.clientUrl,
    replyToEmail: props.replyToEmail,
    reason: 'Tu reçois cet email suite à une demande de réinitialisation de mot de passe.',
  });

  return { subject, html, text };
}
