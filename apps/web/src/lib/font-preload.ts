import instrumentSerifLatinWoff2 from '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2?url';

const PRELOAD_SELECTOR = 'link[rel="preload"][as="font"]';

/**
 * Précharge la fonte d'affichage (Instrument Serif, latin, 400) avant le premier rendu
 * de React : elle porte tous les titres éditoriaux de l'interface. Le fichier référencé
 * est exactement celui du `@font-face` de Fontsource (`font-display: swap`), donc le
 * navigateur ne télécharge qu'une seule fois et les titres ne sautent pas d'un repli vers
 * Instrument Serif. Si la fonte n'arrive pas, `font-serif` retombe sur Georgia.
 */
export function preloadBrandFont(): void {
  if (typeof document === 'undefined' || document.querySelector(PRELOAD_SELECTOR)) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = 'font/woff2';
  // Les téléchargements de polices sont toujours en mode CORS, même en same-origin.
  link.crossOrigin = 'anonymous';
  link.href = instrumentSerifLatinWoff2;
  document.head.appendChild(link);
}
