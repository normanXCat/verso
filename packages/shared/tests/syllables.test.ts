import { describe, expect, it } from 'vitest';
import {
  countLineSyllables,
  countSyllablesPerLine,
  countTotalSyllables,
} from '../src/lyrics-engine/syllables.js';

describe('comptage des syllabes poétiques françaises', () => {
  it('compte zéro syllabe pour une ligne vide ou blanche', () => {
    expect(countLineSyllables('')).toBe(0);
    expect(countLineSyllables('   ')).toBe(0);
  });

  it('compte les groupes de voyelles', () => {
    expect(countLineSyllables('Bonjour')).toBe(2);
    expect(countLineSyllables('amour')).toBe(2);
    expect(countLineSyllables('vie')).toBe(1);
  });

  it('élide le e caduc final en fin de vers', () => {
    expect(countLineSyllables('fille')).toBe(1);
    expect(countLineSyllables('les')).toBe(1);
    expect(countLineSyllables('une')).toBe(1);
  });

  it('gère les particularités graphiques (qu, gu, accents)', () => {
    expect(countLineSyllables('peut-être')).toBe(2);
    expect(countLineSyllables('guerre')).toBe(1);
    expect(countLineSyllables('mangé')).toBe(2);
  });

  it('compte le e caduc sonore devant consonne en mode classique', () => {
    expect(countLineSyllables('arbre debout', { mode: 'classic' })).toBe(4);
    expect(countLineSyllables('arbre debout', { mode: 'relaxed' })).toBe(3);
  });

  it('élide le e caduc devant une voyelle', () => {
    expect(countLineSyllables("l'ombre")).toBe(1);
    expect(countLineSyllables('une amie')).toBe(3);
  });

  it('compte un alexandrin classique à 12 syllabes', () => {
    expect(countLineSyllables('Je marche dans la nuit et je compte les pas')).toBe(12);
  });

  it('retourne le décompte de chaque ligne avec son index', () => {
    const lines = countSyllablesPerLine('Bonjour\n\namour');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatchObject({ line: 0, syllables: 2 });
    expect(lines[1]).toMatchObject({ line: 1, syllables: 0 });
    expect(lines[2]).toMatchObject({ line: 2, syllables: 2 });
  });

  it('totalise les syllabes d’un texte', () => {
    expect(countTotalSyllables('Bonjour\namour')).toBe(4);
    expect(countTotalSyllables('')).toBe(0);
  });
});
