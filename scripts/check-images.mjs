/* eslint-disable no-console */
/* global console, process */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'apps/web/public/images');
const emailDir = path.join(rootDir, 'apps/web/public/email');

const EXPECTED_IMAGES = [
  // Hero (max 200 Ko)
  { path: 'hero/hero-notebook.avif', maxKb: 200 },
  { path: 'hero/hero-notebook.webp', maxKb: 200 },
  { path: 'hero/hero-notebook.jpg', maxKb: 200 },

  // Atelier d'écriture (max 120 Ko)
  { path: 'editor/editor-draft.avif', maxKb: 120 },
  { path: 'editor/editor-draft.webp', maxKb: 120 },
  { path: 'editor/editor-draft.jpg', maxKb: 120 },

  // Organisation des albums (max 120 Ko)
  { path: 'organize/organize-notebooks.avif', maxKb: 120 },
  { path: 'organize/organize-notebooks.webp', maxKb: 120 },
  { path: 'organize/organize-notebooks.jpg', maxKb: 120 },

  // Studio / Vinyle (max 120 Ko)
  { path: 'instrumentals/instrumentals-vinyl.avif', maxKb: 120 },
  { path: 'instrumentals/instrumentals-vinyl.webp', maxKb: 120 },
  { path: 'instrumentals/instrumentals-vinyl.jpg', maxKb: 120 },

  // Intermède panoramique console (max 120 Ko)
  { path: 'interlude/interlude-mixer.avif', maxKb: 120 },
  { path: 'interlude/interlude-mixer.webp', maxKb: 120 },
  { path: 'interlude/interlude-mixer.jpg', maxKb: 120 },

  // Propriété intellectuelle / Sceau (max 120 Ko)
  { path: 'protect/protect-seal.avif', maxKb: 120 },
  { path: 'protect/protect-seal.webp', maxKb: 120 },
  { path: 'protect/protect-seal.jpg', maxKb: 120 },

  // CTA final (max 120 Ko)
  { path: 'cta/cta-concrete.avif', maxKb: 120 },
  { path: 'cta/cta-concrete.webp', maxKb: 120 },
  { path: 'cta/cta-concrete.jpg', maxKb: 120 },

  // Authentification / Casque (max 120 Ko)
  { path: 'auth/auth-headphones.avif', maxKb: 120 },
  { path: 'auth/auth-headphones.webp', maxKb: 120 },
  { path: 'auth/auth-headphones.jpg', maxKb: 120 },

  // Pochettes d'albums sérigraphiées (max 80 Ko)
  { path: 'covers/cover-miroir-fume.avif', maxKb: 80 },
  { path: 'covers/cover-miroir-fume.webp', maxKb: 80 },
  { path: 'covers/cover-miroir-fume.jpg', maxKb: 80 },
  { path: 'covers/cover-noctambule.avif', maxKb: 80 },
  { path: 'covers/cover-noctambule.webp', maxKb: 80 },
  { path: 'covers/cover-noctambule.jpg', maxKb: 80 },
  { path: 'covers/cover-archives.avif', maxKb: 80 },
  { path: 'covers/cover-archives.webp', maxKb: 80 },
  { path: 'covers/cover-archives.jpg', maxKb: 80 },
  { path: 'covers/cover-ep-brut.avif', maxKb: 80 },
  { path: 'covers/cover-ep-brut.webp', maxKb: 80 },
  { path: 'covers/cover-ep-brut.jpg', maxKb: 80 },

  // Image Open Graph (max 250 Ko)
  { path: 'og-preview.png', maxKb: 250 },
];

const EXPECTED_EMAIL_ASSETS = [
  // Logos Wordmark (max 20 Ko)
  { path: 'logo-wordmark-dark.png', maxKb: 20 },
  { path: 'logo-wordmark-light.png', maxKb: 20 },

  // Logos Mark "V" (max 20 Ko)
  { path: 'logo-mark-dark.png', maxKb: 20 },
  { path: 'logo-mark-light.png', maxKb: 20 },

  // Bandeau d'en-tête email (max 60 Ko)
  { path: 'header-banner.jpg', maxKb: 60 },
];

console.log('🔍 Contrôle de présence et d’intégrité des images Verso...');
let hasError = false;

for (const img of EXPECTED_IMAGES) {
  const fullPath = path.join(publicDir, img.path);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Image MANQUANTE : ${img.path}`);
    hasError = true;
    continue;
  }

  const stat = fs.statSync(fullPath);
  const sizeKb = Math.round(stat.size / 1024);
  if (sizeKb > img.maxKb) {
    console.error(`⚠️ Image TROP LOURDE : ${img.path} (${sizeKb} Ko > max ${img.maxKb} Ko)`);
    hasError = true;
  } else {
    console.log(`✅ ${img.path} : ${sizeKb} Ko (limite ${img.maxKb} Ko)`);
  }
}

for (const img of EXPECTED_EMAIL_ASSETS) {
  const fullPath = path.join(emailDir, img.path);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Asset email MANQUANT : ${img.path}`);
    hasError = true;
    continue;
  }

  const stat = fs.statSync(fullPath);
  const sizeKb = Math.round(stat.size / 1024);
  if (sizeKb > img.maxKb) {
    console.error(`⚠️ Asset email TROP LOURD : ${img.path} (${sizeKb} Ko > max ${img.maxKb} Ko)`);
    hasError = true;
  } else {
    console.log(`✅ email/${img.path} : ${sizeKb} Ko (limite ${img.maxKb} Ko)`);
  }
}

if (hasError) {
  console.error('\n🚨 Erreur de validation des images : build interrompu.');
  process.exit(1);
} else {
  console.log('\n🎉 Toutes les images sont présentes et conformes aux critères de performance !');
}
