/* eslint-disable no-console */
/* global console, process, Buffer */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const brandSvgPath = path.join(rootDir, 'docs/brand/logo-wordmark.svg');
const heroJpgPath = path.join(rootDir, 'apps/web/public/images/hero/hero-notebook.jpg');
const outputDir = path.join(rootDir, 'apps/web/public/email');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Lire le SVG original
const originalSvg = fs.readFileSync(brandSvgPath, 'utf8');

// SVG pour fond sombre : texte #EDE6D8, point vermillon #FF5A2E
const darkWordmarkSvg = originalSvg
  .replace(/fill="#14110F"/g, 'fill="#EDE6D8"')
  .replace(/fill="#D9421C"/g, 'fill="#FF5A2E"');

// SVG pour fond clair : texte #14110F, point vermillon #D9421C
const lightWordmarkSvg = originalSvg;

// V mark seul : extraire le tracé du V (viewBox 0 0 493 730)
const vPathMatch = originalSvg.match(/<path fill="#14110F" d="([^"]+)"\/>/);
const vPathD = vPathMatch ? vPathMatch[1] : '';

const darkMarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 493 730">
  <path fill="#EDE6D8" d="${vPathD}"/>
</svg>`;

const lightMarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 493 730">
  <path fill="#14110F" d="${vPathD}"/>
</svg>`;

async function generateAssets() {
  console.log('🎨 Génération des assets email avec sharp...');

  // Wordmark 2x (320px de large, pour un affichage en 160px)
  await sharp(Buffer.from(darkWordmarkSvg))
    .resize({ width: 320 })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, 'logo-wordmark-dark.png'));

  await sharp(Buffer.from(lightWordmarkSvg))
    .resize({ width: 320 })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, 'logo-wordmark-light.png'));

  // Mark "V" 2x (80px de large, pour un affichage en 40px)
  await sharp(Buffer.from(darkMarkSvg))
    .resize({ width: 80 })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, 'logo-mark-dark.png'));

  await sharp(Buffer.from(lightMarkSvg))
    .resize({ width: 80 })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, 'logo-mark-light.png'));

  // Bandeau d'en-tête fin (600 x 160 px JPEG < 60 Ko)
  if (fs.existsSync(heroJpgPath)) {
    await sharp(heroJpgPath)
      .resize(600, 160, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(path.join(outputDir, 'header-banner.jpg'));
  }

  // Vérification des tailles
  const files = fs.readdirSync(outputDir);
  for (const file of files) {
    const stats = fs.statSync(path.join(outputDir, file));
    const kb = (stats.size / 1024).toFixed(1);
    console.log(`  ✅ ${file}: ${kb} Ko`);
  }
}

generateAssets().catch((err) => {
  console.error('Erreur lors de la génération des assets email :', err);
  process.exit(1);
});
