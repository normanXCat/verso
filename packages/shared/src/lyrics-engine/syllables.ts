/**
 * Moteur de comptage des syllabes poétiques françaises.
 *
 * Approche heuristique (adaptée au rap et à la versification) : découpage en
 * groupes de voyelles, gestion du `e` caduc (élision devant voyelle, silence en
 * fin de vers) et des particularités graphiques (`qu`, `gu` muets).
 *
 * Limites connues : les diérèses/synérèses lexicales (`lion`, `sienne`) et les
 * formes verbales en `-ent` ne sont pas traitées ; un dictionnaire phonétique
 * serait nécessaire pour une précision totale.
 */

/** Mode de comptage du `e` caduc. */
export type SyllableMode = 'classic' | 'relaxed';

export interface SyllableOptions {
  /**
   * `classic` (défaut) : le `e` caduc est sonore devant consonne, élidé devant
   * voyelle et muet en fin de vers (versification classique).
   * `relaxed` : tous les `e` caducs finaux sont élidés (débit rap moderne).
   */
  mode?: SyllableMode;
}

export interface LineSyllables {
  /** Index de la ligne (0-based). */
  line: number;
  /** Contenu brut de la ligne. */
  text: string;
  /** Nombre de syllabes poétiques. */
  syllables: number;
}

const VOWELS = 'aàâäeéèêëiîïoôöuùûüyÿœæ';
const VOWEL_CLASS = `[${VOWELS}]`;
const VOWEL_RUN = new RegExp(`${VOWEL_CLASS}+`, 'g');

/** Mots graphiquement proches d'un dissyllabe mais toujours monosyllabiques. */
const MONOSYLLABLE_EXCEPTIONS = new Set(['une']);

function normalizeWord(word: string): string {
  return (
    word
      .toLowerCase()
      .replace(/[’']/g, "'")
      // `u` muet après `q`/`g` devant voyelle (que, qui, guerre, guitare…).
      .replace(/qu/g, 'k')
      .replace(/gu(?=[eiéèêë])/g, 'g')
  );
}

function startsWithVowel(word: string): boolean {
  const first = word[0];
  return first !== undefined && VOWELS.includes(first);
}

/** Détecte un `e`/`es` final de mot précédé d'une consonne (e caduc). */
function hasMuteEnding(word: string): boolean {
  const stripped = word.endsWith('s') ? word.slice(0, -1) : word;
  if (!stripped.endsWith('e')) {
    return false;
  }
  if (stripped.length === 1) {
    return true;
  }
  return !VOWELS.includes(stripped[stripped.length - 2]);
}

function tokenizeLine(line: string): string[] {
  const matches = line.toLowerCase().match(/[\p{L}]+(?:['’-][\p{L}]+)*/gu);
  return matches ? matches.map(normalizeWord) : [];
}

/**
 * Compte les syllabes poétiques d'un vers.
 * Retourne 0 pour une ligne vide.
 */
export function countLineSyllables(line: string, options: SyllableOptions = {}): number {
  const mode = options.mode ?? 'classic';
  const words = tokenizeLine(line);
  if (words.length === 0) {
    return 0;
  }

  let total = 0;

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];

    if (MONOSYLLABLE_EXCEPTIONS.has(word)) {
      total += 1;
      continue;
    }

    const groups = word.match(VOWEL_RUN);
    let count = groups ? groups.length : 1;

    if (hasMuteEnding(word)) {
      const isLastInLine = index === words.length - 1;
      const next = words[index + 1];
      const elides = isLastInLine || (next !== undefined && startsWithVowel(next));
      if (elides || mode === 'relaxed') {
        count = Math.max(1, count - 1);
      }
    }

    total += count;
  }

  return total;
}

/** Compte les syllabes de chaque ligne d'un texte. */
export function countSyllablesPerLine(
  text: string,
  options: SyllableOptions = {},
): LineSyllables[] {
  return text.split('\n').map((line, index) => ({
    line: index,
    text: line,
    syllables: countLineSyllables(line, options),
  }));
}

/** Nombre total de syllabes d'un texte. */
export function countTotalSyllables(text: string, options: SyllableOptions = {}): number {
  return countSyllablesPerLine(text, options).reduce((sum, line) => sum + line.syllables, 0);
}
