import { useCallback, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import type { RemoteCursorData } from '../components/editor/extensions/remoteCursors.js';

export interface ParticipantInfo {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  color: string;
}

export interface StudioTransportMessage {
  type: 'studio:transport';
  actorId: string;
  action: 'play' | 'pause' | 'seek';
  position: number;
  bpm?: number;
  timestamp: number;
}

export interface StudioMetronomeMessage {
  type: 'studio:metronome';
  actorId: string;
  isEnabled: boolean;
  bpm: number;
  timestamp: number;
}

export interface UseRealtimeEditorOptions {
  songId: string;
  enabled?: boolean;
  initialContent?: string;
  onContentChange?: (newContent: string) => void;
}

export interface UseRealtimeEditorResult {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  participants: ParticipantInfo[];
  remoteCursors: RemoteCursorData[];
  content: string;
  updateContent: (newContent: string) => void;
  sendCursor: (from: number, to: number) => void;
  sendStudioTransport: (action: 'play' | 'pause' | 'seek', position: number, bpm?: number) => void;
  sendStudioMetronome: (isEnabled: boolean, bpm: number) => void;
  subscribeStudioTransport: (callback: (data: StudioTransportMessage) => void) => () => void;
  subscribeStudioMetronome: (callback: (data: StudioMetronomeMessage) => void) => () => void;
}

/**
 * Calcule la modification minimale entre deux chaînes pour préserver
 * l'historique et les ancres relatives dans le document Yjs partagé.
 */
function applyStringToYText(ytext: Y.Text, next: string): void {
  const current = ytext.toString();
  if (current === next) {
    return;
  }

  let start = 0;
  while (start < current.length && start < next.length && current[start] === next[start]) {
    start++;
  }

  let endCurr = current.length;
  let endNext = next.length;
  while (endCurr > start && endNext > start && current[endCurr - 1] === next[endNext - 1]) {
    endCurr--;
    endNext--;
  }

  if (endCurr > start) {
    ytext.delete(start, endCurr - start);
  }
  if (endNext > start) {
    ytext.insert(start, next.slice(start, endNext));
  }
}

function getWsUrl(songId: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/api/realtime/songs/${encodeURIComponent(songId)}`;
}

/**
 * Hook gérant la session temps réel Yjs, les présences, curseurs
 * et la synchronisation de transport pour une chanson.
 */
export function useRealtimeEditor({
  songId,
  enabled = true,
  initialContent = '',
  onContentChange,
}: UseRealtimeEditorOptions): UseRealtimeEditorResult {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [remoteCursorsMap, setRemoteCursorsMap] = useState<Map<string, RemoteCursorData>>(
    new Map(),
  );
  const [content, setContent] = useState(initialContent);

  const docRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const transportSubscribersRef = useRef<Set<(data: StudioTransportMessage) => void>>(new Set());
  const metronomeSubscribersRef = useRef<Set<(data: StudioMetronomeMessage) => void>>(new Set());
  const onContentChangeRef = useRef(onContentChange);

  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  // Initialisation du document Yjs
  if (!docRef.current) {
    const doc = new Y.Doc();
    const ytext = doc.getText('lyrics');
    if (initialContent) {
      ytext.insert(0, initialContent);
    }
    docRef.current = doc;
    ytextRef.current = ytext;
  }

  // Connexion WebSocket
  useEffect(() => {
    if (!enabled || !songId) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    const doc = docRef.current!;
    const ytext = ytextRef.current!;

    let ws: WebSocket;
    try {
      ws = new WebSocket(getWsUrl(songId));
    } catch {
      setIsConnecting(false);
      setError('Impossible d’ouvrir la connexion WebSocket');
      return;
    }

    wsRef.current = ws;

    // Envoi des mises à jour Yjs locales
    const handleYUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin !== 'remote' && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'sync',
            payload: Array.from(update),
          }),
        );
      }
    };
    doc.on('update', handleYUpdate);

    // Écoute des modifications du texte
    const handleTextObserver = () => {
      const next = ytext.toString();
      setContent(next);
      onContentChangeRef.current?.(next);
    };
    ytext.observe(handleTextObserver);

    ws.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'sync': {
            if (Array.isArray(data.payload)) {
              Y.applyUpdate(doc, new Uint8Array(data.payload), 'remote');
            }
            break;
          }
          case 'presence': {
            if (Array.isArray(data.participants)) {
              setParticipants(data.participants);
            }
            break;
          }
          case 'user_joined': {
            if (data.user) {
              setParticipants((prev) => {
                const next = prev.filter((p) => p.userId !== data.user.userId);
                return [...next, data.user];
              });
            }
            break;
          }
          case 'user_left': {
            if (data.userId) {
              setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
              setRemoteCursorsMap((prev) => {
                const next = new Map(prev);
                next.delete(data.userId);
                return next;
              });
            }
            break;
          }
          case 'cursor': {
            if (data.userId && data.cursor) {
              setParticipants((currentParticipants) => {
                const author = currentParticipants.find((p) => p.userId === data.userId);
                const color = author?.color || '#3b82f6';
                const displayName = author?.displayName || 'Co-auteur';

                setRemoteCursorsMap((prev) => {
                  const next = new Map(prev);
                  next.set(data.userId, {
                    userId: data.userId,
                    displayName,
                    color,
                    from: data.cursor.from,
                    to: data.cursor.to,
                  });
                  return next;
                });

                return currentParticipants;
              });
            }
            break;
          }
          case 'studio:transport': {
            for (const cb of transportSubscribersRef.current) {
              cb(data);
            }
            break;
          }
          case 'studio:metronome': {
            for (const cb of metronomeSubscribersRef.current) {
              cb(data);
            }
            break;
          }
        }
      } catch {
        // Ignorer les messages malformés
      }
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      setIsConnecting(false);
      if (event.code === 4404) {
        setError('Accès refusé ou ressource introuvable');
      } else if (event.code === 4401) {
        setError('Session expirée');
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
      setIsConnecting(false);
      setError('Erreur de communication en direct');
    };

    return () => {
      doc.off('update', handleYUpdate);
      ytext.unobserve(handleTextObserver);
      ws.close();
      wsRef.current = null;
    };
  }, [enabled, songId]);

  const updateContent = useCallback((newContent: string) => {
    if (!ytextRef.current || !docRef.current) {
      return;
    }
    docRef.current.transact(() => {
      applyStringToYText(ytextRef.current!, newContent);
    }, 'local');
  }, []);

  const sendCursor = useCallback((from: number, to: number) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'cursor',
          cursor: { from, to },
        }),
      );
    }
  }, []);

  const sendStudioTransport = useCallback(
    (action: 'play' | 'pause' | 'seek', position: number, bpm?: number) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'studio:transport',
            action,
            position,
            bpm,
          }),
        );
      }
    },
    [],
  );

  const sendStudioMetronome = useCallback((isEnabled: boolean, bpm: number) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'studio:metronome',
          isEnabled,
          bpm,
        }),
      );
    }
  }, []);

  const subscribeStudioTransport = useCallback(
    (callback: (data: StudioTransportMessage) => void) => {
      transportSubscribersRef.current.add(callback);
      return () => {
        transportSubscribersRef.current.delete(callback);
      };
    },
    [],
  );

  const subscribeStudioMetronome = useCallback(
    (callback: (data: StudioMetronomeMessage) => void) => {
      metronomeSubscribersRef.current.add(callback);
      return () => {
        metronomeSubscribersRef.current.delete(callback);
      };
    },
    [],
  );

  return {
    isConnected,
    isConnecting,
    error,
    participants,
    remoteCursors: Array.from(remoteCursorsMap.values()),
    content,
    updateContent,
    sendCursor,
    sendStudioTransport,
    sendStudioMetronome,
    subscribeStudioTransport,
    subscribeStudioMetronome,
  };
}
