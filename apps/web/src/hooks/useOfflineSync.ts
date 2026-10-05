import { useCallback, useEffect, useRef, useState } from 'react';
import type { SongDetail } from '@verso/shared';
import { songsClient, SongsApiError } from '../lib/songs-client.js';
import { clearDraft, writeDraft } from '../lib/draft-storage.js';
import {
  clearSyncItemForSong,
  decideSyncAction,
  deleteDraft,
  listSyncQueue,
  replaceSyncItem,
  saveDraft,
  type SyncQueueItem,
} from '../lib/offline-storage.js';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error' | 'conflict';

/** Suffixe imposé à la copie créée lors d'un conflit de synchronisation (FR-047). */
export const OFFLINE_COPY_SUFFIX = ' (copie hors ligne)';

interface UseOfflineSyncOptions {
  /** Identifiant du texte (`null` désactive la synchronisation). */
  songId: string | null;
  title: string;
  content: string;
  enabled?: boolean;
  /** Contenu serveur connu au chargement, référence de détection de conflit. */
  baselineContent?: string;
  /** Délai de debounce ; doit rester sous 500 ms (sauvegarde continue). */
  delayMs?: number;
  /** Appelé après création d'une copie de conflit : reçoit la copie et la version distante intacte. */
  onConflict?: (created: SongDetail, serverContent: string) => void;
}

interface UseOfflineSyncResult {
  status: SaveStatus;
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
  /** Force la synchronisation immédiate (file d'attente puis contenu courant). */
  syncNow: () => Promise<void>;
}

function navigatorOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

/**
 * Synchronise le contenu de l'éditeur avec le serveur en garantissant zéro perte :
 * - persistance immédiate du brouillon dans IndexedDB (et `localStorage` en repli) ;
 * - sauvegarde distante debouncée (< 500 ms) quand le réseau est disponible ;
 * - file d'attente d'actions rejouée au retour de la connexion ;
 * - en cas de conflit (texte modifié ailleurs pendant la déconnexion), la version
 *   distante reste intacte et le contenu local est conservé dans une copie
 *   `[Titre] (copie hors ligne)` (FR-047).
 */
export function useOfflineSync({
  songId,
  title,
  content,
  enabled = true,
  baselineContent,
  delayMs = 400,
  onConflict,
}: UseOfflineSyncOptions): UseOfflineSyncResult {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [isOnline, setIsOnline] = useState<boolean>(navigatorOnline);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const songIdRef = useRef<string | null>(songId);
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const baselineRef = useRef<string>(baselineContent ?? '');
  const lastSyncedRef = useRef<string | null>(null);
  // Une vérification serveur est nécessaire au chargement et après une déconnexion
  // pour ne jamais écraser une modification faite sur un autre appareil.
  const needsCheckRef = useRef(true);
  const busyRef = useRef(false);
  const onConflictRef = useRef(onConflict);

  useEffect(() => {
    onConflictRef.current = onConflict;
  }, [onConflict]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const refreshPending = useCallback(async () => {
    const queue = await listSyncQueue();
    setPendingCount(queue.length);
  }, []);

  // Réinitialise les références à chaque changement de texte.
  useEffect(() => {
    songIdRef.current = songId;
    baselineRef.current = baselineContent ?? '';
    lastSyncedRef.current = baselineContent ?? null;
    needsCheckRef.current = true;
    setStatus('idle');
    void refreshPending();
  }, [songId, baselineContent, refreshPending]);

  const persistLocally = useCallback((item: SyncQueueItem): void => {
    writeDraft(item.songId, item.content);
    void saveDraft({
      songId: item.songId,
      title: item.title,
      content: item.content,
      baseContent: item.baseContent,
      updatedAt: item.createdAt,
    });
  }, []);

  /**
   * Résout une action en attente face à l'état serveur : applique le contenu local
   * si le serveur n'a pas bougé, sinon préserve le local dans une copie distincte.
   */
  const resolveAgainstServer = useCallback(
    async (item: SyncQueueItem): Promise<'saved' | 'conflict'> => {
      let serverContent: string | null;
      try {
        const server = await songsClient.get(item.songId);
        serverContent = server.content;
      } catch (error) {
        if (error instanceof SongsApiError && error.statusCode === 404) {
          serverContent = null;
        } else {
          throw error;
        }
      }

      const decision = decideSyncAction({
        serverContent,
        localContent: item.content,
        baseContent: item.baseContent,
      });

      let outcome: 'saved' | 'conflict' = 'saved';

      if (decision === 'apply-local') {
        await songsClient.update(item.songId, { content: item.content });
        lastSyncedRef.current = item.content;
        baselineRef.current = item.content;
      } else if (decision === 'conflict') {
        const copy = await songsClient.create({
          title: `${item.title || 'Sans titre'}${OFFLINE_COPY_SUFFIX}`,
          content: item.content,
        });
        baselineRef.current = serverContent ?? '';
        lastSyncedRef.current = serverContent;
        outcome = 'conflict';
        if (item.songId === songIdRef.current) {
          onConflictRef.current?.(copy, serverContent ?? '');
        }
      } else {
        lastSyncedRef.current = item.content;
        baselineRef.current = item.content;
      }

      await deleteDraft(item.songId);
      clearDraft(item.songId);
      await clearSyncItemForSong(item.songId);
      await refreshPending();
      return outcome;
    },
    [refreshPending],
  );

  const flushQueue = useCallback(async (): Promise<void> => {
    if (!navigatorOnline()) {
      setStatus('offline');
      await refreshPending();
      return;
    }

    busyRef.current = true;
    try {
      let queue = await listSyncQueue();
      // Boucle bornée : récupère les actions ajoutées pendant la synchronisation.
      for (let pass = 0; queue.length > 0 && pass < 5 && navigatorOnline(); pass += 1) {
        setStatus('saving');
        for (const item of queue) {
          if (!navigatorOnline()) {
            break;
          }
          const outcome = await resolveAgainstServer(item);
          setStatus(outcome);
        }
        setLastSyncedAt(new Date());
        queue = await listSyncQueue();
      }
      if (queue.length > 0 && !navigatorOnline()) {
        setStatus('offline');
      }
    } catch {
      setStatus('offline');
    } finally {
      busyRef.current = false;
      await refreshPending();
    }
  }, [resolveAgainstServer, refreshPending]);

  const persist = useCallback(
    async (value: string): Promise<void> => {
      const id = songIdRef.current;
      if (!id || lastSyncedRef.current === value) {
        return;
      }

      const item: SyncQueueItem = {
        songId: id,
        title: titleRef.current,
        content: value,
        baseContent: baselineRef.current,
        createdAt: new Date().toISOString(),
      };

      // Une synchronisation est déjà en cours : on met l'édition en file d'attente,
      // elle sera reprise par la boucle de vidage.
      if (busyRef.current) {
        persistLocally(item);
        await replaceSyncItem(item);
        await refreshPending();
        return;
      }

      // Hors ligne : persistance locale immédiate et mise en file d'attente.
      if (!navigatorOnline()) {
        persistLocally(item);
        await replaceSyncItem(item);
        setStatus('offline');
        await refreshPending();
        return;
      }

      busyRef.current = true;
      setStatus('saving');
      try {
        if (needsCheckRef.current) {
          const outcome = await resolveAgainstServer(item);
          setStatus(outcome);
        } else {
          await songsClient.update(id, { content: value });
          lastSyncedRef.current = value;
          baselineRef.current = value;
          await deleteDraft(id);
          clearDraft(id);
          setLastSyncedAt(new Date());
          setStatus('saved');
        }
        needsCheckRef.current = false;
      } catch {
        if (!navigatorOnline()) {
          persistLocally(item);
          await replaceSyncItem(item);
          setStatus('offline');
        } else {
          setStatus('error');
        }
        await refreshPending();
      } finally {
        busyRef.current = false;
      }
    },
    [persistLocally, resolveAgainstServer, refreshPending],
  );

  // Persistance locale immédiate puis sauvegarde distante debouncée.
  useEffect(() => {
    const id = songIdRef.current;
    if (!id || !enabled) {
      return;
    }
    if (lastSyncedRef.current === null) {
      lastSyncedRef.current = content;
      return;
    }
    if (lastSyncedRef.current === content) {
      return;
    }

    writeDraft(id, content);
    void saveDraft({
      songId: id,
      title: titleRef.current,
      content,
      baseContent: baselineRef.current,
      updatedAt: new Date().toISOString(),
    });

    const timer = window.setTimeout(() => {
      void persist(content);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [songId, content, enabled, delayMs, persist]);

  // File d'attente rejouée au retour du réseau ou au montage.
  useEffect(() => {
    const handleOnline = (): void => {
      setIsOnline(true);
      needsCheckRef.current = true;
      void flushQueue();
    };
    const handleOffline = (): void => {
      setIsOnline(false);
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigatorOnline()) {
      void flushQueue();
    } else {
      setStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushQueue]);

  const syncNow = useCallback(async (): Promise<void> => {
    await flushQueue();
    if (lastSyncedRef.current !== contentRef.current) {
      await persist(contentRef.current);
    }
  }, [flushQueue, persist]);

  return { status, isOnline, pendingCount, lastSyncedAt, syncNow };
}
