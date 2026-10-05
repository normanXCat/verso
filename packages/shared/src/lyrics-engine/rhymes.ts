/**
 * Moteur de détection et de regroupement des rimes françaises.
 *
 * Approche phonétique simplifiée : la terminaison sonore de chaque vers est
 * extraite depuis la dernière voyelle tonique (accents neutralisés, nasales et
 * diphtongues normalisées), puis les vers partageant la même terminaison sont
 * regroupés pour colorer les schémas de rimes.
 *
 * Limites connues : l'analyse porte sur la graphie et non sur une transcription
 * phonétique complète ; quelques homophones irréguliers peuvent échapper au
 * regroupement.
 */

/** Palette de teintes distinctes attribuées aux groupes de rimes. */
export const RHYME_PALETTE = [
  '#c2410c',
  '#15803d',
  '#4338ca',
  '#be123c',
  '#0e7490',
  '#7e22ce',
] as const;

export interface RhymeLineInfo {
  /** Index de la ligne (0-based). */
  line: number;
  /** Contenu brut de la ligne. */
  text: string;
  /** Clé phonétique de la terminaison, `null` si la ligne est vide. */
  key: string | null;
  /** Identifiant du groupe de rimes, `null` si la ligne ne rime avec aucune autre. */
  group: number | null;
  /** Index dans `RHYME_PALETTE`, `null` si aucun groupe. */
  colorIndex: number | null;
}

export interface RhymeAnalysis {
  lines: RhymeLineInfo[];
  /** Nombre de groupes de rimes effectifs (au moins deux vers). */
  groupCount: number;
}

/**
 * Terminaisons prononcées [e] (infinitifs, participes, imparfaits, divers
 * mots en `-ai/-et`) : elles riment entre elles quelle que soit la graphie.
 */
const RHYME_E_ENDINGS = /(er|ez|ée?s?|ai|ais|ait|aient|et)$/;

/**
 * Normalise une forme graphique pour l'analyse des rimes : minuscules, ligatures
 * développées, accents neutralisés, `y` ramené à `i`, puis suppression des
 * consonnes finales muettes (`temps`, `gens`…) et des `e` caducs terminaux.
 */
export function normalizeRhymeWord(input: string): string {
  const normalized = input
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z'-]/g, '')
    .replace(/y/g, 'i');

  return normalized.replace(/[sxztpd]+$/, '').replace(/e+$/, '');
}

/** Extrait la clé phonétique de la terminaison d'un vers. */
export function rhymeKeyOf(line: string): string | null {
  const words = line.toLowerCase().match(/[\p{L}]+(?:['’-][\p{L}]+)*/gu);
  if (!words || words.length === 0) {
    return null;
  }

  const lastWord = words[words.length - 1];

  // Rimes en [e] : détectées sur la graphie accentuée pour ne pas confondre
  // avec les `e` caducs muets (fille, bitume…).
  if (RHYME_E_ENDINGS.test(lastWord)) {
    return 'e';
  }

  const word = normalizeRhymeWord(lastWord);
  if (word.length === 0) {
    return 'e';
  }

  const matches = [...word.matchAll(/[aeiou]+/g)];
  if (matches.length === 0) {
    return word;
  }

  const start = matches[matches.length - 1].index ?? 0;
  const key = word.slice(start);

  // Normalisation phonétique : diphtongues puis nasales.
  return key
    .replace(/oeu/g, 'eu')
    .replace(/eau|au/g, 'o')
    .replace(/ai|ei/g, 'e')
    .replace(/oi/g, 'oa')
    .replace(/ain|ein|aim|im|in/g, 'IN')
    .replace(/am|em|an|en/g, 'AN')
    .replace(/om|on/g, 'ON')
    .replace(/um|un/g, 'UN');
}

/** Analyse les rimes d'un texte ligne par ligne et attribue les groupes/couleurs. */
export function analyzeRhymes(text: string): RhymeAnalysis {
  const rawLines = text.split('\n');
  const keys = rawLines.map(rhymeKeyOf);

  const linesByKey = new Map<string, number[]>();
  keys.forEach((key, index) => {
    if (!key) {
      return;
    }
    const existing = linesByKey.get(key);
    if (existing) {
      existing.push(index);
    } else {
      linesByKey.set(key, [index]);
    }
  });

  // Seules les terminaisons partagées par au moins deux vers forment une rime.
  const groupIdByKey = new Map<string, number>();
  let groupCount = 0;
  for (const [key, lineIndexes] of linesByKey) {
    if (lineIndexes.length >= 2) {
      groupIdByKey.set(key, groupCount);
      groupCount += 1;
    }
  }

  const lines: RhymeLineInfo[] = rawLines.map((lineText, index) => {
    const key = keys[index];
    const group = key ? (groupIdByKey.get(key) ?? null) : null;
    return {
      line: index,
      text: lineText,
      key,
      group,
      colorIndex: group === null ? null : group % RHYME_PALETTE.length,
    };
  });

  return { lines, groupCount };
}
