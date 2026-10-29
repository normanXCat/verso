/* eslint-disable no-console */
/* global console */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateEmail, getSampleEmailProps } from '../apps/api/src/emails/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'docs/screenshots/emails');
const tmpDir = path.join(rootDir, 'apps/api/dist/tmp-email-renders');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Pour le rendu local autonome des images dans Chromium, on peut référencer le chemin absolu local des images
const localAssetsUrl = `file://${path.join(rootDir, 'apps/web/public')}`;

const SCENARIOS = [
  {
    name: 'preview-verification-dark-600',
    type: 'verification',
    mode: 'dark',
    width: 600,
    height: 960,
  },
  {
    name: 'preview-verification-light-600',
    type: 'verification',
    mode: 'light',
    width: 600,
    height: 960,
  },
  {
    name: 'preview-verification-mobile-375',
    type: 'verification',
    mode: 'dark',
    width: 375,
    height: 960,
  },
  {
    name: 'preview-welcome-dark-600',
    type: 'welcome',
    mode: 'dark',
    width: 600,
    height: 920,
  },
  {
    name: 'preview-collab-dark-600',
    type: 'collaboration-invite',
    mode: 'dark',
    width: 600,
    height: 980,
  },
  {
    name: 'preview-password-changed-dark-600',
    type: 'password-changed',
    mode: 'dark',
    width: 600,
    height: 900,
  },
];

console.log('📸 Capture des rendus d’emails via Chromium Headless...');

for (const sc of SCENARIOS) {
  const props = getSampleEmailProps(sc.type, 'https://verso-lyrics.vercel.app');
  // Injecter l'URL locale pour que Chromium charge les images PNG et JPG locales
  props.assetsUrl = localAssetsUrl;

  const email = generateEmail(sc.type, props);
  let html = email.html;

  if (sc.mode === 'light') {
    const lightStyles = `
      <style>
        .email-bg { background-color: #F4EFE6 !important; }
        .email-card { background-color: #FFFFFF !important; border-color: #DDD5C6 !important; }
        .email-heading { color: #14110F !important; }
        .email-text { color: #14110F !important; }
        .email-text-secondary { color: #666158 !important; }
        .email-text-muted { color: #8C8578 !important; }
        .infobox { background-color: #FAF7F2 !important; border-color: #DDD5C6 !important; }
        .infobox-title { color: #14110F !important; }
        .code-box { background-color: #F0EAE0 !important; border-color: #EAE4D8 !important; }
        .code-link { color: #D9421C !important; }
        .btn-cell-primary { background-color: #CD3711 !important; }
        .btn-link-primary { color: #FFFFFF !important; }
        .btn-cell-secondary { background-color: #FAF7F2 !important; border-color: #DDD5C6 !important; }
        .btn-link-secondary { color: #14110F !important; }
        .divider { border-color: #DDD5C6 !important; }
        .email-footer { border-color: #DDD5C6 !important; }
        .banner-cell { border-color: #DDD5C6 !important; }
        .logo-dark { display: none !important; }
        .logo-light { display: block !important; }
      </style>
    `;
    html = html.replace('</head>', `${lightStyles}</head>`);
  }

  const htmlFilePath = path.join(tmpDir, `${sc.name}.html`);
  fs.writeFileSync(htmlFilePath, html, 'utf8');

  const outImagePath = path.join(outDir, `${sc.name}.png`);

  try {
    execFileSync('chromium', [
      '--headless',
      '--disable-gpu',
      '--allow-file-access-from-files',
      `--window-size=${sc.width},${sc.height}`,
      `--screenshot=${outImagePath}`,
      `file://${htmlFilePath}`,
    ]);

    const stat = fs.statSync(outImagePath);
    console.log(`  ✅ ${sc.name}.png (${Math.round(stat.size / 1024)} Ko)`);
  } catch (err) {
    console.error(`  ❌ Échec capture pour ${sc.name} :`, err);
  }
}

// Nettoyage des fichiers temporaires
if (fs.existsSync(tmpDir)) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log('🎉 Captures des prévisualisations terminées !');
