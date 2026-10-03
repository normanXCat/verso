/**
 * Compte le nombre de mots d'un texte (séquences non blanches).
 */
export function countWords(text: string): number {
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

/**
 * Compte le nombre de lignes d'un texte. Un texte vide vaut 0 ligne.
 */
export function countLines(text: string): number {
  if (text.length === 0) {
    return 0;
  }
  return text.split('\n').length;
}
