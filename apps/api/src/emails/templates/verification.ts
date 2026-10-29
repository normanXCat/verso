import {
  renderHeading,
  renderParagraph,
  renderBulletproofButton,
  renderFallbackLink,
  renderInfoBox,
  renderFeatureList,
  renderSecurityNote,
} from '../common/components.js';
import { renderEmailLayout } from '../common/layout.js';
import { renderTextLayout } from '../common/text-layout.js';

export interface VerificationEmailProps {
  displayName?: string | null;
  rawToken: string;
  clientUrl: string;
  assetsUrl: string;
  replyToEmail?: string;
  showBanner?: boolean;
}

export function buildVerificationEmail(props: VerificationEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Vérifie ton adresse email — Verso';
  const preheader = 'Un clic pour activer ton carnet.';
  const verificationUrl = `${props.clientUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(props.rawToken)}`;

  const greetingName = props.displayName ? `, ${props.displayName}` : '';
  const headingText = `Bienvenue dans ton carnet${greetingName}.`;

  const features = [
    {
      title: 'Écrire',
      desc: 'un éditeur sobre sans distraction, avec comptage syllabique et détection de rimes.',
    },
    {
      title: 'Organiser',
      desc: 'classe tes textes dans des albums et réordonne ta tracklist par glisser-déposer.',
    },
    {
      title: 'Collaborer',
      desc: 'invite des co-auteurs, conserve l’historique des versions et échange des retours ciblés.',
    },
  ];

  const htmlContent = [
    renderHeading(headingText),
    renderParagraph(
      'Confirme ton adresse email pour activer ton compte et commencer à poser tes textes.',
    ),
    renderBulletproofButton({
      text: 'Vérifier mon adresse email',
      url: verificationUrl,
    }),
    renderFallbackLink(
      verificationUrl,
      'Ce lien expire dans 24 heures et ne fonctionne qu’une seule fois.',
    ),
    renderInfoBox(renderFeatureList(features), { title: 'Pour commencer dans ton carnet :' }),
    renderSecurityNote(
      'Tu n’as pas créé de compte Verso ? Ignore simplement ce message : aucun compte ne sera activé.',
    ),
  ].join('');

  const html = renderEmailLayout(htmlContent, {
    subject,
    preheader,
    clientUrl: props.clientUrl,
    assetsUrl: props.assetsUrl,
    replyToEmail: props.replyToEmail,
    reason: 'Tu reçois cet email parce qu’une inscription a été faite avec cette adresse.',
    showBanner: props.showBanner,
  });

  const textBody = [
    headingText,
    '',
    'Confirme ton adresse email pour activer ton compte et commencer à poser tes textes.',
    '',
    `Lien de vérification : ${verificationUrl}`,
    '(Ce lien expire dans 24 heures et ne fonctionne qu’une seule fois)',
    '',
    'Pour commencer dans ton carnet :',
    ...features.map((f) => `• ${f.title} : ${f.desc}`),
    '',
    'Tu n’as pas créé de compte Verso ? Ignore simplement ce message : aucun compte ne sera activé.',
  ].join('\n');

  const text = renderTextLayout(textBody, {
    subject,
    clientUrl: props.clientUrl,
    replyToEmail: props.replyToEmail,
    reason: 'Tu reçois cet email parce qu’une inscription a été faite avec cette adresse.',
  });

  return { subject, html, text };
}
