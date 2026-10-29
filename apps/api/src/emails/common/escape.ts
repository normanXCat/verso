/**
 * Fonctions d'échappement et de sécurisation pour la génération HTML des emails.
 * Empêche toute injection de HTML, de balises <script>, d'attributs arbitraires
 * ou d'URLs malicieuses (javascript:, data:, etc.).
 */

/**
 * Échappe les caractères spéciaux HTML afin d'éviter toute injection XSS.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Valide et assainit une URL pour un attribut href.
 * N'autorise strictement que les protocoles http:// et https://.
 */
export function sanitizeUrl(url: unknown): string {
  if (!url || typeof url !== 'string') {
    return '#';
  }
  const trimmed = url.trim();
  // N'autorise que http et https
  if (/^https?:\/\//i.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  // URL relative sécurisée commençant par un slash unique (pas //)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return escapeHtml(trimmed);
  }
  return '#';
}
