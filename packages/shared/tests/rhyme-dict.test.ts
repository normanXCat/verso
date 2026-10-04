import { describe, expect, it } from 'vitest';
import { findRhymes, rhymeKeyOf, RHYME_DICTIONARY } from '../src/index.js';

describe('findRhymes', () => {
  it('propose des rimes pour une terminaison en [ɔ̃]', () => {
    const rhymes = findRhymes('maison');
    const words = rhymes.map((r) => r.word);
    expect(words).toContain('saison');
    expect(words).toContain('raison');
    expect(words).not.toContain('maison');
  });

  it('classe les rimes riches avant les suffisantes', () => {
    const rhymes = findRhymes('maison');
    const saison = rhymes.find((r) => r.word === 'saison');
    expect(saison?.richness).toBe('rich');
    const firstSufficient = rhymes.findIndex((r) => r.richness === 'sufficient');
    const lastRich = rhymes.map((r) => r.richness).lastIndexOf('rich');
    if (firstSufficient !== -1 && lastRich !== -1) {
      expect(lastRich).toBeLessThan(firstSufficient);
    }
  });

  it('propose des rimes pour « vie » et « rivière »', () => {
    expect(findRhymes('vie').map((r) => r.word)).toContain('envie');
    expect(findRhymes('rivière').map((r) => r.word)).toContain('lumière');
  });

  it('propose des rimes pour « toujours »', () => {
    expect(findRhymes('toujours').map((r) => r.word)).toContain('amour');
  });

  it('renvoie un tableau vide pour un mot sans clé phonétique', () => {
    expect(findRhymes('')).toEqual([]);
    expect(findRhymes('!!!')).toEqual([]);
  });

  it('respecte la limite demandée', () => {
    expect(findRhymes('maison', { limit: 3 }).length).toBeLessThanOrEqual(3);
  });

  it('accepte une majuscule et des accents', () => {
    const rhymes = findRhymes('Été');
    expect(rhymes.length).toBeGreaterThan(0);
    expect(rhymeKeyOf('Été')).toBe('e');
  });

  it('ne contient que des chaînes non vides dans le dictionnaire', () => {
    expect(RHYME_DICTIONARY.every((word) => word.trim().length > 0)).toBe(true);
  });
});
