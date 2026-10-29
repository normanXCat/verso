import {
  renderHeading,
  renderParagraph,
  renderBulletproofButton,
  renderInfoBox,
  renderFeatureList,
  renderSecurityNote,
} from '../common/components.js';
import { renderEmailLayout } from '../common/layout.js';
import { renderTextLayout } from '../common/text-layout.js';

export interface WelcomeEmailProps {
  displayName?: string | null;
  clientUrl: string;
  assetsUrl: string;
  replyToEmail?: string;
  showBanner?: boolean;
}

export function buildWelcomeEmail(props: WelcomeEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Ton carnet d’écriture est prêt — Verso';
  const preheader = 'Ton carnet Verso est prêt pour ta première ligne.';
  const appUrl = `${props.clientUrl.replace(/\/$/, '')}/app`;

  const greetingName = props.displayName ? `, ${props.displayName}` : '';
  const headingText = `C’est validé${greetingName}.`;

  const features = [
    {
      title: 'Pose ton premier texte',
      desc: 'sauvegarde continue en local et en ligne, zéro perte de rimes même hors connexion.',
    },
    {
      title: 'Pose une instru',
      desc: 'importe un fichier audio (MP3 ou WAV) pour écrire calé au BPM avec le métronome.',
    },
    {
      title: 'Protège tes écrits',
      desc: 'génère un certificat PDF horodaté certifiant l’antériorité de tes créations.',
    },
  ];

  const htmlContent = [
    renderHeading(headingText),
    renderParagraph(
      'Ton adresse email est confirmée et ton carnet est entièrement déverrouillé. Toutes tes rimes sont sauvegardées en temps réel.',
    ),
    renderBulletproofButton({
      text: 'Ouvrir mon carnet',
      url: appUrl,
    }),
    renderInfoBox(renderFeatureList(features), { title: 'Ce que tu peux faire dès maintenant :' }),
    renderSecurityNote(
      'Besoin d’aide ou d’un conseil ? Réponds directement à cet email pour échanger avec nous.',
    ),
  ].join('');

  const html = renderEmailLayout(htmlContent, {
    subject,
    preheader,
    clientUrl: props.clientUrl,
    assetsUrl: props.assetsUrl,
    replyToEmail: props.replyToEmail,
    reason: 'Tu reçois cet email pour confirmer la validation de ton adresse.',
    showBanner: props.showBanner,
  });

  const textBody = [
    headingText,
    '',
    'Ton adresse email est confirmée et ton carnet est entièrement déverrouillé. Toutes tes rimes sont sauvegardées en temps réel.',
    '',
    `Accéder à ton carnet : ${appUrl}`,
    '',
    'Ce que tu peux faire dès maintenant :',
    ...features.map((f) => `• ${f.title} : ${f.desc}`),
  ].join('\n');

  const text = renderTextLayout(textBody, {
    subject,
    clientUrl: props.clientUrl,
    replyToEmail: props.replyToEmail,
    reason: 'Tu reçois cet email pour confirmer la validation de ton adresse.',
  });

  return { subject, html, text };
}
