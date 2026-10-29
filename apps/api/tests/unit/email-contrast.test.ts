import { describe, it, expect } from 'vitest';
import { EMAIL_PALETTE } from '../../src/emails/common/palette.js';

/**
 * Calcule la luminance relative d'une couleur hexadécimale selon la formule WCAG 2.1 :
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r8 = parseInt(cleanHex.substring(0, 2), 16);
  const g8 = parseInt(cleanHex.substring(2, 4), 16);
  const b8 = parseInt(cleanHex.substring(4, 6), 16);

  const srgb = [r8 / 255, g8 / 255, b8 / 255];
  const linear = srgb.map((val) => {
    return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/**
 * Calcule le ratio de contraste entre deux couleurs :
 * (L1 + 0.05) / (L2 + 0.05) où L1 est la luminance la plus claire.
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Accessibilité & Ratios de contraste WCAG AA des emails (email-contrast.test.ts)', () => {
  describe('Palette Sombre (par défaut)', () => {
    const dark = EMAIL_PALETTE.dark;

    it('le texte principal (#EDE6D8) sur la carte (#171512) respecte le niveau AAA (≥ 7:1)', () => {
      const ratio = getContrastRatio(dark.text, dark.card);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it('le texte secondaire (#9A9183) sur la carte (#171512) respecte le niveau AA (≥ 4.5:1)', () => {
      const ratio = getContrastRatio(dark.textSecondary, dark.card);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('le bouton principal : texte sombre (#14110F) sur accent (#FF5A2E) respecte le niveau AA (≥ 4.5:1)', () => {
      const ratio = getContrastRatio(dark.buttonText, dark.accent);
      // Le texte du bouton en #14110F garantit un contraste fort sur #FF5A2E
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('l’accent vermillon (#FF5A2E) sur le fond de carte (#171512) est bien visible (≥ 3:1)', () => {
      const ratio = getContrastRatio(dark.accent, dark.card);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });
  });

  describe('Palette Claire (repli prefers-color-scheme: light)', () => {
    const light = EMAIL_PALETTE.light;

    it('le texte principal (#14110F) sur la carte blanche (#FFFFFF) respecte le niveau AAA (≥ 7:1)', () => {
      const ratio = getContrastRatio(light.text, light.card);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it('le texte secondaire (#666158) sur la carte blanche (#FFFFFF) respecte le niveau AA (≥ 4.5:1)', () => {
      const ratio = getContrastRatio(light.textSecondary, light.card);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('le bouton clair : texte blanc (#FFFFFF) sur accent respecte le niveau AA (≥ 4.5:1)', () => {
      const ratio = getContrastRatio(light.buttonText, light.accent);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('l’accent vermillon sur le fond de carte (#FFFFFF) respecte le niveau AA (≥ 4.5:1)', () => {
      const ratio = getContrastRatio(light.accent, light.card);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
