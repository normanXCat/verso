import { useCallback, useEffect, useRef, useState } from 'react';
import { songsClient } from '../lib/songs-client.js';
import { clearDraft, writeDraft } from '../lib/draft-storage.js';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

interface UseAutoSaveOptions {
  /** Identifiant du texte à sauvegarder (`null` désactive la sauvegarde). */
  songId: string | null;
  /** Contenu courant des paroles. */
  content: string;
  enabled?: boolean;
  /** Délai de debounce ; doit rester sous 500 ms (exigence de sauvegarde continue). */
  delayMs?: number;
}

interface UseAutoSaveResult {
  status: SaveStatus;
  lastSavedAt: Date | null;
  saveNow: () => Promise<void>;
}

/**
 * Sauvegarde automatiquement le contenu d'un texte sans bouton :
 * - écriture locale immédiate (zéro perte, même hors ligne) ;
 * - sauvegarde distante debouncée (< 500 ms) ;
 * - nouvelle tentative automatique au retour de la connexion.
 */
export function useAutoSave({
  songId,
  content,
  enabled = true,
  delayMs = 400,
}: UseAutoSaveOptions): UseAutoSaveResult {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const lastSavedContentRef = useRef<string | null>(null);
  const contentRef = useRef(content);
  const savingRef = useRef(false);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Réinitialise la référence lorsqu'on change de texte.
  useEffect(() => {
    lastSavedContentRef.current = null;
  }, [songId]);

  const persist = useCallback(
    async (value: string): Promise<void> => {
      if (!songId || savingRef.current || lastSavedContentRef.current === value) {
        return;
      }

      savingRef.current = true;
      setStatus('saving');

      try {
        await songsClient.update(songId, { content: value });
        lastSavedContentRef.current = value;
        setLastSavedAt(new Date());
        setStatus('saved');
        clearDraft(songId);
      } catch {
        setStatus(navigator.onLine ? 'error' : 'offline');
      } finally {
        savingRef.current = false;
      }
    },
    [songId],
  );

  // Écriture locale immédiate puis sauvegarde distante debouncée.
  useEffect(() => {
    if (!songId || !enabled) {
      return;
    }

    if (lastSavedContentRef.current === null) {
      // Montage ou changement de texte : on considère le contenu comme déjà sauvegardé.
      lastSavedContentRef.current = content;
      return;
    }

    if (lastSavedContentRef.current === content) {
      return;
    }

    writeDraft(songId, content);
    const timer = setTimeout(() => {
      void persist(content);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [songId, content, enabled, delayMs, persist]);

  // Nouvelle tentative dès le retour de la connexion.
  useEffect(() => {
    const handleOnline = (): void => {
      void persist(contentRef.current);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [persist]);

  const saveNow = useCallback(async (): Promise<void> => {
    await persist(contentRef.current);
  }, [persist]);

  return { status, lastSavedAt, saveNow };
}
