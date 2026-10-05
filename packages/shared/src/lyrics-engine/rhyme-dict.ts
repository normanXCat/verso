import { normalizeRhymeWord, rhymeKeyOf } from './rhymes.js';

/**
 * Base lexicale française embarquée pour les suggestions de rimes (FR-049).
 *
 * Le vocabulaire est volontairement resserré sur des mots courants de l'écriture
 * rap et de la langue générale. Les suggestions sont calculées à partir de la clé
 * phonétique des terminaisons (`rhymeKeyOf`) puis classées par richesse, définie
 * par la longueur du suffixe graphique commun.
 */
export const RHYME_DICTIONARY: readonly string[] = [
  // Terminaisons en [ɔ̃] / [ɑ̃] (maison, saison, chanson, temps, argent…)
  'maison',
  'saison',
  'raison',
  'façon',
  'leçon',
  'chanson',
  'passion',
  'action',
  'attention',
  'question',
  'nation',
  'vision',
  'décision',
  'occasion',
  'impression',
  'expression',
  'profession',
  'mission',
  'position',
  'condition',
  'émotion',
  'promotion',
  'région',
  'opinion',
  'million',
  'dimension',
  'direction',
  'protection',
  'affection',
  'temps',
  'printemps',
  'moment',
  'vraiment',
  'lentement',
  'doucement',
  'seulement',
  'maintenant',
  'content',
  'argent',
  'vent',
  'sang',
  'grand',
  'quand',
  'pendant',
  'enfant',
  'marchand',
  'charmant',
  'courant',
  'différent',
  'important',
  'présent',
  'absent',
  'violent',
  'silence',
  'danse',
  'chance',
  'France',
  'avance',
  'défense',
  'immense',

  // Terminaisons en [uʁ] (amour, toujours, retour…)
  'amour',
  'toujours',
  'retour',
  'jour',
  'autour',
  'tambour',
  'carrefour',
  'vautour',
  'séjour',
  'labour',
  'bonjour',
  'velours',
  'concours',
  'discours',
  'parcours',
  'recours',
  'ours',
  'cours',
  'source',
  'course',
  'bourse',

  // Terminaisons en [i] (vie, envie, nuit…)
  'vie',
  'envie',
  'amie',
  'folie',
  'magie',
  'oubli',
  'ici',
  'aussi',
  'ainsi',
  'nuit',
  'fruit',
  'bruit',
  'conduit',
  'détruit',
  'appui',
  'ennui',
  'pluie',
  'fuite',
  'conduite',
  'poursuite',
  'réussite',
  'limite',
  'dynamite',
  'petite',
  'vite',
  'invite',
  'site',
  'mélodie',
  'harmonie',
  'énergie',
  'poésie',
  'théorie',
  'histoire',
  'mémoire',
  'gloire',
  'victoire',
  'espoir',

  // Terminaisons en [jɛʁ] / [ɛʁ] (lumière, terre, père…)
  'lumière',
  'rivière',
  'colère',
  'misère',
  'prière',
  'terre',
  'guerre',
  'père',
  'mère',
  'frère',
  'verre',
  'pierre',
  'manière',
  'matière',
  'frontière',
  'carrière',
  'barrière',
  'première',
  'dernière',
  'entière',
  'ouvrière',
  'sorcière',
  'poussière',
  'univers',
  'travers',
  'divers',

  // Terminaisons en [œʁ] (cœur, bonheur, douleur…)
  'cœur',
  'bonheur',
  'malheur',
  'douleur',
  'couleur',
  'fleur',
  'peur',
  'sœur',
  'valeur',
  'chaleur',
  'odeur',
  'rumeur',
  'vapeur',
  'erreur',
  'horreur',
  'ferveur',
  'langueur',

  // Terminaisons en [ɛ̃] (main, demain, matin…)
  'main',
  'demain',
  'matin',
  'chemin',
  'destin',
  'jardin',
  'moulin',
  'refrain',
  'copain',
  'pain',
  'grain',
  'train',
  'plein',
  'lointain',
  'soudain',
  'certain',
  'incertain',
  'peinture',
  'ceinture',

  // Terminaisons en [yʁ] (nature, voiture, aventure…)
  'nature',
  'culture',
  'voiture',
  'écriture',
  'lecture',
  'ouverture',
  'couverture',
  'fermeture',
  'aventure',
  'peinture',
  'brûlure',
  'rayure',

  // Terminaisons nasales [ɔ̃] en -onde/-ombre (monde, ombre…)
  'monde',
  'seconde',
  'profonde',
  'blonde',
  'ronde',
  'ombre',
  'sombre',
  'nombre',
  'colombe',
  'pénombre',

  // Terminaisons en [y] (rue, vue, venue…)
  'rue',
  'vue',
  'venue',
  'revenue',
  'inconnue',
  'devenue',
  'tenue',
  'retenue',
  'vertu',
  'déçu',
  'reçu',
  'aperçu',
  'connu',
  'perdu',
  'vécu',
  'couru',
  'accouru',
  'statut',
  'absolu',
  'résolu',

  // Terminaisons en [wa] (roi, foi, voix…)
  'roi',
  'foi',
  'loi',
  'voix',
  'choix',
  'mois',
  'poids',
  'crois',
  'soit',
  'endroit',
  'droit',
  'froid',
  'étroit',
  'adroit',
  'effroi',
  'exploit',
  'tournoi',
  'emploi',
  'désarroi',

  // Terminaisons en [e] (aimer, parler, été…)
  'aimer',
  'parler',
  'chanter',
  'penser',
  'rêver',
  'crier',
  'pleurer',
  'danser',
  'avancer',
  'recommencer',
  'oublier',
  'prier',
  'essayer',
  'raconter',
  'trouver',
  'garder',
  'regarder',
  'écouter',
  'été',
  'vérité',
  'liberté',
  'réalité',
  'clarté',
  'volonté',
  'beauté',
  'société',
  'amitié',
  'moitié',
  'pitié',
  'fierté',
  'curiosité',
  'éternité',

  // Terminaisons en [ɑ̃] / [ɛ̃] (aime, même, problème…)
  'aime',
  'même',
  'thème',
  'problème',
  'système',
  'poème',
  'blême',
  'suprême',
  'extrême',
  'scène',
  'peine',
  'haine',
  'veine',
  'reine',
  'chaîne',
  'semaine',
  'moyenne',
  'antienne',

  // Terminaisons en [ɔn]/[on] (couronne, personne…)
  'couronne',
  'personne',
  'raisonne',
  'donne',
  'tonne',
  'bonne',
  'sonne',
  'étonne',
  'abandonne',
  'pardonner',
  'résonne',

  // Terminaisons en [aʒ] / [ɔʒ] (voyage, image…)
  'voyage',
  'image',
  'nuage',
  'orage',
  'courage',
  'message',
  'langage',
  'partage',
  'ouvrage',
  'visage',
  'sauvage',
  'hommage',
  'nage',
  'cage',
  'page',
  'plage',
  'rage',
];

export type RhymeRichness = 'rich' | 'sufficient';

export interface RhymeSuggestion {
  word: string;
  richness: RhymeRichness;
}

export interface FindRhymesOptions {
  /** Nombre maximal de suggestions renvoyées. */
  limit?: number;
}

/** Longueur du plus long suffixe commun à deux chaînes normalisées. */
function commonSuffixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let count = 0;
  while (count < max && a[a.length - 1 - count] === b[b.length - 1 - count]) {
    count += 1;
  }
  return count;
}

/**
 * Propose des rimes françaises pour un mot donné.
 *
 * Seuls les mots partageant la même clé phonétique de terminaison sont retenus.
 * Une rime est dite « riche » lorsque le suffixe graphique commun atteint au moins
 * trois caractères, et « suffisante » sinon (FR-049).
 */
export function findRhymes(word: string, options: FindRhymesOptions = {}): RhymeSuggestion[] {
  const targetKey = rhymeKeyOf(word);
  if (!targetKey) {
    return [];
  }

  const targetNormalized = normalizeRhymeWord(word);
  const seen = new Set<string>([targetNormalized]);
  const results: RhymeSuggestion[] = [];

  for (const candidate of RHYME_DICTIONARY) {
    const normalized = normalizeRhymeWord(candidate);
    if (normalized.length === 0 || seen.has(normalized)) {
      continue;
    }
    if (rhymeKeyOf(candidate) !== targetKey) {
      continue;
    }
    seen.add(normalized);
    const richness: RhymeRichness =
      commonSuffixLength(targetNormalized, normalized) >= 3 ? 'rich' : 'sufficient';
    results.push({ word: candidate, richness });
  }

  results.sort((a, b) => {
    if (a.richness !== b.richness) {
      return a.richness === 'rich' ? -1 : 1;
    }
    return a.word.localeCompare(b.word, 'fr');
  });

  return results.slice(0, options.limit ?? 60);
}
