/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateEmail,
  getSampleEmailProps,
  type EmailType,
  type AnyEmailProps,
} from '../apps/api/src/emails/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Charger les variables de .env simplement sans dépendance externe
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const VALID_TYPES: EmailType[] = [
  'verification',
  'welcome',
  'forgot-password',
  'password-changed',
  'collaboration-invite',
  'activity-notification',
];

const type = process.argv[2] as EmailType;
const to = process.argv[3];

function printUsage() {
  console.log(`
Usage:
  pnpm email:send-test <type> <destinataire>

Types disponibles :
  - verification          (Vérification d'adresse email)
  - welcome               (Bienvenue après vérification)
  - forgot-password       (Demande de mot de passe oublié)
  - password-changed      (Alerte mot de passe modifié)
  - collaboration-invite  (Invitation à collaborer sur un texte/album)
  - activity-notification (Résumé d'activité et notifications)

Exemple :
  pnpm email:send-test verification artiste@exemple.fr
`);
}

if (!type || !to) {
  console.error('❌ Erreur : type d’email et adresse destinataire requis.');
  printUsage();
  process.exit(1);
}

if (!VALID_TYPES.includes(type)) {
  console.error(`❌ Erreur : type d’email « ${type} » inconnu.`);
  printUsage();
  process.exit(1);
}

if (!to.includes('@') || !to.includes('.')) {
  console.error(`❌ Erreur : adresse email « ${to} » invalide.`);
  process.exit(1);
}

const clientUrl = process.env.CLIENT_URL || 'https://verso-lyrics.vercel.app';
const assetsUrl = process.env.EMAIL_ASSETS_URL || 'https://verso-lyrics.vercel.app';
const emailFrom = process.env.EMAIL_FROM || 'Verso <noreply@verso.fr>';
const emailReplyTo = process.env.EMAIL_REPLY_TO || 'contact@verso-lyrics.vercel.app';
const resendApiKey = process.env.RESEND_API_KEY?.trim();

const props = getSampleEmailProps(type, clientUrl);
props.clientUrl = clientUrl;
props.assetsUrl = assetsUrl;
props.replyToEmail = emailReplyTo;

console.log(`\n📧 Préparation de l'email « ${type} » pour : ${to}`);
const email = generateEmail(type, props as AnyEmailProps);
console.log(`   Objet : ${email.subject}`);

if (!resendApiKey) {
  console.log('\n⚠️  Aucune RESEND_API_KEY configurée dans .env :');
  console.log('   Affichage de la version texte brut simulée :\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`De    : ${emailFrom}`);
  console.log(`À     : ${to}`);
  console.log(`Objet : ${email.subject}`);
  console.log('───────────────────────────────────────────────────────────');
  console.log(email.text);
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(
    '✅ Simulation réussie ! Pour un envoi réel, configurez RESEND_API_KEY dans votre fichier .env.\n',
  );
  process.exit(0);
}

async function send() {
  console.log(`\n🚀 Envoi réel via l'API Resend à ${to}...`);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [to],
        subject: email.subject,
        text: email.text,
        html: email.html,
        ...(emailReplyTo ? { reply_to: emailReplyTo } : {}),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`❌ Échec Resend (${response.status}) :`, data);
      process.exit(1);
    }

    console.log(`✅ Email envoyé avec succès ! ID Resend : ${data.id}`);
  } catch (err) {
    console.error('❌ Erreur réseau lors de l’envoi :', err);
    process.exit(1);
  }
}

send();
