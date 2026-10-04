import { describe, expect, it } from 'vitest';
import { analyzeRhymes, RHYME_PALETTE, rhymeKeyOf } from '../src/lyrics-engine/rhymes.js';

describe('détection et regroupement des rimes françaises', () => {
  it('retourne null pour une ligne vide', () => {
    expect(rhymeKeyOf('')).toBeNull();
    expect(rhymeKeyOf('   ')).toBeNull();
  });

  it('rapproche les terminaisons sonores équivalentes', () => {
    expect(rhymeKeyOf('amour')).toBe(rhymeKeyOf('jour'));
    expect(rhymeKeyOf('manger')).toBe(rhymeKeyOf('chanter'));
    expect(rhymeKeyOf('aimer')).toBe(rhymeKeyOf('aimé'));
    expect(rhymeKeyOf('temps')).toBe(rhymeKeyOf('gens'));
  });

  it('distingue deux terminaisons différentes', () => {
    expect(rhymeKeyOf('nuit')).not.toBe(rhymeKeyOf('bitume'));
  });

  it('regroupe un quatrain en rimes croisées A-B-A-B', () => {
    const analysis = analyzeRhymes(
      [
        'Les ombres de la nuit',
        'Dansent sur le bitume',
        "Le silence et l'ennui",
        'Rongent comme une brume',
      ].join('\n'),
    );

    expect(analysis.groupCount).toBe(2);
    // A-B-A-B : vers 0 et 2 partagent un groupe, vers 1 et 3 l'autre.
    expect(analysis.lines[0].group).toBe(analysis.lines[2].group);
    expect(analysis.lines[1].group).toBe(analysis.lines[3].group);
    expect(analysis.lines[0].group).not.toBe(analysis.lines[1].group);
  });

  it('attribue une couleur de palette à chaque groupe', () => {
    const analysis = analyzeRhymes('amour\njour\nnuit');
    const colored = analysis.lines.filter((line) => line.group !== null);
    expect(colored).toHaveLength(2);
    for (const line of colored) {
      expect(line.colorIndex).toBeGreaterThanOrEqual(0);
      expect(line.colorIndex).toBeLessThan(RHYME_PALETTE.length);
    }
  });

  it('n’attribue aucun groupe à un vers orphelin', () => {
    const analysis = analyzeRhymes('amour\njour\nsolitude');
    expect(analysis.lines[2].group).toBeNull();
    expect(analysis.lines[2].colorIndex).toBeNull();
  });

  it('renvoie zéro groupe pour un texte vide', () => {
    const analysis = analyzeRhymes('');
    expect(analysis.groupCount).toBe(0);
    expect(analysis.lines[0].group).toBeNull();
  });
});
