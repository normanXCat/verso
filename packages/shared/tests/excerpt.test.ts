import { describe, expect, it } from 'vitest';
import { cleanExcerpt } from '../src/lyrics-engine/excerpt.js';

describe('lyrics-engine / cleanExcerpt', () => {
  it('saute les titres Markdown et les sections entre crochets', () => {
    const raw = `
# L'ENVERS DU DÉCOR
### INTRO
Ny Malagasy tsy kivy
[Couplet 1]
J'ai griffonné des rimes sur le zinc
    `.trim();

    const result = cleanExcerpt(raw);
    expect(result).not.toContain("# L'ENVERS DU DÉCOR");
    expect(result).not.toContain('### INTRO');
    expect(result).not.toContain('[Couplet 1]');
    expect(result).toBe("Ny Malagasy tsy kivy J'ai griffonné des rimes sur le zinc");
  });

  it('retire le gras, l’italique, le code et les puces de listes', () => {
    const raw = `
- **Bercé** par les gyrophares
- Un *reflet* dans le rétro
- Et du \`code\` sous la semelle
    `.trim();

    const result = cleanExcerpt(raw);
    expect(result).toBe(
      'Bercé par les gyrophares Un reflet dans le rétro Et du code sous la semelle',
    );
    expect(result).not.toContain('*');
    expect(result).not.toContain('`');
    expect(result).not.toContain('-');
  });

  it('tronque proprement avec une coupure de mot et ellipse', () => {
    const longText =
      'Dans la pénombre de la ville endormie les mots résonnent comme des échos du passé et tracent un sillon indélébile dans la mémoire des anonymes qui marchent sans fin.';
    const result = cleanExcerpt(longText, 60);

    expect(result.length).toBeLessThanOrEqual(61);
    expect(result.endsWith('…')).toBe(true);
    // Vérifie que la coupure préserve un mot entier ("résonnent")
    expect(result).toBe('Dans la pénombre de la ville endormie les mots résonnent…');
  });

  it('ne rend aucun HTML même si du HTML malveillant est injecté', () => {
    const raw = 'Texte avec <script>alert("xss")</script> et <span class="tag">balise</span>';
    const result = cleanExcerpt(raw);

    expect(result).not.toContain('<script>');
    expect(result).not.toContain('</script>');
    expect(result).not.toContain('<span');
    expect(result).toBe('Texte avec alert("xss") et balise');
  });

  it('gère les textes vides, nuls ou constitués uniquement de titres', () => {
    expect(cleanExcerpt('')).toBe('');
    expect(cleanExcerpt(null)).toBe('');
    expect(cleanExcerpt(undefined)).toBe('');

    const onlyTitle = '# Uniquement un titre';
    expect(cleanExcerpt(onlyTitle)).toBe('Uniquement un titre');
  });
});
