/* eslint-disable no-console */
/* global console, window */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  chromium,
} = require('/home/normanxcat/Lab/CoFound.mg/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'docs/screenshots/cards');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Trouver le fichier CSS produit par le build
const distAssetsDir = path.join(rootDir, 'apps/web/dist/assets');
const cssFiles = fs.readdirSync(distAssetsDir).filter((file) => file.endsWith('.css'));
const cssContent =
  cssFiles.length > 0 ? fs.readFileSync(path.join(distAssetsDir, cssFiles[0]), 'utf8') : '';

// Page HTML de test autonome répliquant exactement le composant SongCard
const htmlContent = `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Test Playwright SongCard</title>
  <style>
    ${cssContent}
    body {
      background-color: var(--color-bg, #0E0D0B);
      color: var(--color-text, #EDE6D8);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }
    #log {
      font-family: monospace;
      font-size: 13px;
      color: #9A9183;
      min-height: 40px;
    }
  </style>
</head>
<body>
  <div id="log">Prêt pour les clics</div>

  <div style="width: 100%; max-width: 480px;">
    <!-- Exacte réplique de Card + SongCard -->
    <div
      id="card"
      data-testid="song-card"
      class="group relative flex h-full flex-col gap-3 notebook-ruled focus-within:ring-2 focus-within:ring-paper-accent focus-within:ring-offset-2 focus-within:ring-offset-paper-bg rounded-card border border-paper-border bg-paper-surface p-6 shadow-paper-sm cursor-pointer hover:border-paper-muted"
      style="min-height: 220px;"
    >
      <div class="flex items-start justify-between gap-3">
        <h3 class="font-serif text-xl leading-snug text-paper-text group-hover:text-paper-accent transition-colors">
          <a
            id="song-link"
            href="/app/songs/test-song-123"
            class="rounded-xs focus:outline-none after:absolute after:inset-0 after:z-0 after:content-['']"
          >
            Légende urbaine
          </a>
        </h3>

        <div class="flex shrink-0 items-center gap-1.5">
          <button
            id="fav-btn"
            type="button"
            aria-label="Marquer comme favori"
            title="Marquer comme favori"
            class="relative z-10 rounded p-1 text-paper-muted transition-colors hover:text-paper-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-accent"
          >
            <svg id="star-icon" class="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>

          <button
            id="status-btn"
            type="button"
            aria-label="Marquer comme terminé"
            class="relative z-10 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-accent"
          >
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-medium tracking-tight select-none font-mono border-paper-accent/40 text-paper-accent bg-paper-accent/10">
              Brouillon
            </span>
          </button>
        </div>
      </div>

      <p id="excerpt" class="pointer-events-none line-clamp-2 text-sm leading-relaxed text-paper-muted">
        Dans la pénombre de la ville endormie les mots résonnent comme des échos du passé et tracent un sillon indélébile dans la mémoire…
      </p>

      <div id="tags" class="pointer-events-none flex flex-wrap gap-1.5">
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-medium tracking-tight select-none font-sans border-paper-border text-paper-muted bg-paper-surface">
          Rap
        </span>
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-medium tracking-tight select-none font-sans border-paper-border text-paper-muted bg-paper-surface">
          Freestyle
        </span>
      </div>

      <div id="empty-area" style="height: 24px;"></div>

      <div id="footer" class="pointer-events-none mt-auto flex items-center justify-between border-t border-paper-border/60 pt-2 text-[11px] font-mono text-paper-muted">
        <span class="truncate">Sans album</span>
        <span class="shrink-0">Modifié le 29 oct. 2026</span>
      </div>
    </div>
  </div>

  <script>
    window.__events = [];
    const logEl = document.getElementById('log');

    document.getElementById('song-link').addEventListener('click', (e) => {
      e.preventDefault();
      window.__events.push('navigated:/app/songs/test-song-123');
      logEl.textContent = 'Navigation déclenchée vers /app/songs/test-song-123';
    });

    document.getElementById('fav-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.__events.push('clicked:favorite');
      logEl.textContent = 'Bouton favori cliqué (aucune navigation)';
    });

    document.getElementById('status-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.__events.push('clicked:status');
      logEl.textContent = 'Bouton statut cliqué (aucune navigation)';
    });
  </script>
</body>
</html>`;

// Démarrer un serveur HTTP local temporaire
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(htmlContent);
});

await new Promise((resolve) => server.listen(8765, resolve));
console.log('🌐 Serveur de test démarré sur http://localhost:8765');

const browser = await chromium.launch({
  headless: true,
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  // Test 1: Desktop 1440px
  console.log('🖥️  Test Desktop 1440px...');
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktopPage.goto('http://localhost:8765');

  // Capture initiale desktop
  await desktopPage.screenshot({ path: path.join(outDir, 'card-desktop-1440.png') });
  console.log('  📸 Capture sauvegardée: docs/screenshots/cards/card-desktop-1440.png');

  // Vérification 1.1 : Clic sur le titre
  await desktopPage.evaluate(() => {
    window.__events = [];
  });
  await desktopPage.click('#song-link');
  let events = await desktopPage.evaluate(() => window.__events);
  console.log('  👉 Clic titre :', events);
  if (!events.includes('navigated:/app/songs/test-song-123')) throw new Error('Échec clic titre');

  // Vérification 1.2 : Clic sur l'extrait (coordonnées de l'extrait reçues par le lien étiré)
  await desktopPage.evaluate(() => {
    window.__events = [];
  });
  const excerptBox = await desktopPage.locator('#excerpt').boundingBox();
  await desktopPage.mouse.click(excerptBox.x + 20, excerptBox.y + 10);
  events = await desktopPage.evaluate(() => window.__events);
  console.log('  👉 Clic extrait (coordonnées réelles vers lien étiré) :', events);
  if (!events.includes('navigated:/app/songs/test-song-123')) throw new Error('Échec clic extrait');

  // Vérification 1.3 : Clic sur le pied de carte (coordonnées du footer reçues par le lien étiré)
  await desktopPage.evaluate(() => {
    window.__events = [];
  });
  const footerBox = await desktopPage.locator('#footer').boundingBox();
  await desktopPage.mouse.click(footerBox.x + 20, footerBox.y + 10);
  events = await desktopPage.evaluate(() => window.__events);
  console.log('  👉 Clic pied de carte (coordonnées réelles vers lien étiré) :', events);
  if (!events.includes('navigated:/app/songs/test-song-123')) throw new Error('Échec clic footer');

  // Vérification 1.4 : Clic sur l'espace vide
  await desktopPage.evaluate(() => {
    window.__events = [];
  });
  const emptyBox = await desktopPage.locator('#empty-area').boundingBox();
  await desktopPage.mouse.click(emptyBox.x + 20, emptyBox.y + 10);
  events = await desktopPage.evaluate(() => window.__events);
  console.log('  👉 Clic espace vide (après ::after) :', events);
  if (!events.includes('navigated:/app/songs/test-song-123'))
    throw new Error('Échec clic espace vide');

  // Vérification 1.5 : Clic sur le bouton favori (étoile)
  await desktopPage.evaluate(() => {
    window.__events = [];
  });
  await desktopPage.click('#fav-btn');
  events = await desktopPage.evaluate(() => window.__events);
  console.log('  👉 Clic étoile favori :', events);
  if (!events.includes('clicked:favorite')) throw new Error('Échec clic favori');
  if (events.some((e) => e.startsWith('navigated')))
    throw new Error('Le clic favori a déclenché une navigation !');

  // Vérification 1.6 : Clic sur le bouton de statut
  await desktopPage.evaluate(() => {
    window.__events = [];
  });
  await desktopPage.click('#status-btn');
  events = await desktopPage.evaluate(() => window.__events);
  console.log('  👉 Clic statut :', events);
  if (!events.includes('clicked:status')) throw new Error('Échec clic statut');
  if (events.some((e) => e.startsWith('navigated')))
    throw new Error('Le clic statut a déclenché une navigation !');

  await desktopPage.close();

  // Test 2: Mobile 375px
  console.log('📱 Test Mobile 375px...');
  const mobilePage = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await mobilePage.goto('http://localhost:8765');

  // Capture initiale mobile
  await mobilePage.screenshot({ path: path.join(outDir, 'card-mobile-375.png') });
  console.log('  📸 Capture sauvegardée: docs/screenshots/cards/card-mobile-375.png');

  // Clic sur l'extrait sur mobile (coordonnées réelles vers lien étiré)
  await mobilePage.evaluate(() => {
    window.__events = [];
  });
  const mobExcerptBox = await mobilePage.locator('#excerpt').boundingBox();
  await mobilePage.mouse.click(mobExcerptBox.x + 20, mobExcerptBox.y + 10);
  events = await mobilePage.evaluate(() => window.__events);
  console.log('  👉 Clic extrait mobile (coordonnées vers lien étiré) :', events);
  if (!events.includes('navigated:/app/songs/test-song-123'))
    throw new Error('Échec clic extrait mobile');

  // Clic sur l'étoile sur mobile
  await mobilePage.evaluate(() => {
    window.__events = [];
  });
  await mobilePage.click('#fav-btn');
  events = await mobilePage.evaluate(() => window.__events);
  console.log('  👉 Clic étoile favori mobile :', events);
  if (!events.includes('clicked:favorite')) throw new Error('Échec clic favori mobile');
  if (events.some((e) => e.startsWith('navigated')))
    throw new Error('Le clic favori mobile a navigué !');

  await mobilePage.close();
  console.log('🎉 Tous les tests Playwright ont validé le comportement à 100% !');
} finally {
  await browser.close();
  server.close();
}
