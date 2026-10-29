import { SONG_EXCERPT_MAX_LENGTH } from '../schemas/search.js';

/**
 * Nettoie et formate un extrait de paroles à partir d'un texte brut Markdown.
 *
 * Règles :
 * 1. Saute les lignes de titre Markdown (# Titre, ## Sous-titre, etc.) et les lignes
 *    d'en-tête de section courantes en rap/chanson ([Intro], [Couplet 1], [Refrain], etc.).
 * 2. Retire les balises et marques Markdown : gras (** ou __), italique (* ou _),
 *    listes à puces (- ou * ou +) et numérotées, code en ligne (`), liens Markdown.
 * 3. Normalise les espaces et sauts de ligne multiples.
 * 4. Tronque proprement à une frontière de mot (~140 caractères par défaut) avec ellipse « … ».
 * 5. Ne renvoie aucun code HTML.
 */
export function cleanExcerpt(content: string | null | undefined, maxLength: number = 140): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Séparation en lignes pour filtrer les lignes de titre et de section
  const lines = content.split(/\r?\n/);
  const cleanedLines: string[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      continue;
    }

    // 1. Saute les titres Markdown (#, ##, ###...)
    if (/^#{1,6}\s+/.test(trimmed)) {
      continue;
    }

    // Saute les balises de section courantes (ex: [Couplet 1], [Refrain], [Intro], [Outro], [Pont])
    if (/^\[[^\]]+\]$/.test(trimmed)) {
      continue;
    }

    // Saute les lignes de séparation setext (---, ===)
    if (/^[-=]{2,}$/.test(trimmed)) {
      continue;
    }

    // 2. Nettoie le contenu de la ligne
    let line = trimmed;

    // Retire les puces de liste (- item, * item, + item) et numérotées (1. item)
    line = line.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '');

    // Retire les marqueurs de citation (> citation)
    line = line.replace(/^>\s+/, '');

    // Retire les liens Markdown [texte](url) -> texte
    line = line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Retire le code en ligne `code` -> code
    line = line.replace(/`([^`]+)`/g, '$1');

    // Retire le gras/italique (**texte**, __texte__, *texte*, _texte_)
    line = line.replace(/(\*\*|__)(.*?)\1/g, '$2');
    line = line.replace(/(\*|_)(.*?)\1/g, '$2');

    // Élimine toute balise HTML éventuelle
    line = line.replace(/<[^>]*>/g, '');

    // Normalise les espaces intérieurs
    line = line.replace(/\s+/g, ' ').trim();

    if (line.length > 0) {
      cleanedLines.push(line);
    }
  }

  // Si tout le texte était composé de titres/sections (# Mon titre), on replie sur le texte brut nettoyé
  let combined = cleanedLines.join(' ');
  if (combined.length === 0) {
    combined = content
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^\[[^\]]+\]$/gm, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (combined.length === 0) {
    return '';
  }

  const limit = Math.min(maxLength, SONG_EXCERPT_MAX_LENGTH);
  if (combined.length <= limit) {
    return combined;
  }

  // Coupure propre à une frontière de mot
  const truncated = combined.slice(0, limit);
  const lastSpace = truncated.lastIndexOf(' ');
  const cleanCut = lastSpace > Math.floor(limit * 0.6) ? truncated.slice(0, lastSpace) : truncated;

  return `${cleanCut.trimEnd()}…`;
}
