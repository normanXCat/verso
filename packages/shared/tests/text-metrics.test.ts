import { describe, expect, it } from 'vitest';
import { countLines, countWords } from '../src/text-metrics.js';

describe('compteurs de mots et de lignes', () => {
  it('compte zéro mot pour un texte vide ou blanc', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   \n  ')).toBe(0);
  });

  it('compte les mots séparés par des espaces ou des sauts de ligne', () => {
    expect(countWords('un deux trois')).toBe(3);
    expect(countWords('premier couplet\nsecond couplet')).toBe(4);
    expect(countWords("j'écris   la nuit")).toBe(3);
  });

  it('compte les lignes d’un texte', () => {
    expect(countLines('')).toBe(0);
    expect(countLines('une seule ligne')).toBe(1);
    expect(countLines('couplet 1\ncouplet 2\nrefrain')).toBe(3);
  });

  it('compte la ligne vide finale', () => {
    expect(countLines('a\n')).toBe(2);
  });
});
