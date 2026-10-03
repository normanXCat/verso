const DRAFT_PREFIX = 'verso:draft:';

function draftKey(songId: string): string {
  return `${DRAFT_PREFIX}${songId}`;
}

/**
 * Lit le brouillon local d'un texte, ou `null` si aucun n'est présent.
 * La persistance locale garantit l'absence de perte même sans réseau.
 */
export function readDraft(songId: string): string | null {
  try {
    return window.localStorage.getItem(draftKey(songId));
  } catch {
    return null;
  }
}

export function writeDraft(songId: string, content: string): void {
  try {
    window.localStorage.setItem(draftKey(songId), content);
  } catch {
    // Stockage indisponible : la sauvegarde distante reste la source de vérité.
  }
}

export function clearDraft(songId: string): void {
  try {
    window.localStorage.removeItem(draftKey(songId));
  } catch {
    // Aucun nettoyage nécessaire.
  }
}
