/**
 * Générateur de version texte brut (plain text) pour tous les emails de Verso.
 * Format sobre, soigné, sans fioritures superflues, parfaitement lisible
 * sur n'importe quel terminal ou client texte pur (mutt, alpine, etc.).
 */

export interface TextLayoutOptions {
  subject: string;
  clientUrl: string;
  replyToEmail?: string;
  reason: string;
}

export function renderTextLayout(contentBody: string, options: TextLayoutOptions): string {
  const separator = '──────────────────────────────────────────────────────────';
  const footerLines = [
    separator,
    "Verso · Atelier d'écriture pour auteurs de rap",
    `Site web : ${options.clientUrl}`,
    options.replyToEmail ? `Contact  : ${options.replyToEmail}` : '',
    '',
    options.reason,
  ]
    .filter(Boolean)
    .join('\n');

  return [contentBody.trim(), '', footerLines].join('\n\n');
}
