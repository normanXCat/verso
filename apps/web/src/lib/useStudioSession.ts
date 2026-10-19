import { useEffect, useState, useCallback, useRef } from 'react';
import type { UseRealtimeEditorResult } from './useRealtimeEditor.js';
import type { UseAudioPlayerResult } from '../hooks/useAudioPlayer.js';

export interface UseStudioSessionOptions {
  realtime: UseRealtimeEditorResult;
  player: UseAudioPlayerResult;
  initialBpm?: number;
}

export interface UseStudioSessionResult {
  isStudioActive: boolean;
  toggleStudioMode: () => void;
  metronomeEnabled: boolean;
  bpm: number;
  lastActorId: string | null;
  syncPlay: (position?: number) => void;
  syncPause: () => void;
  syncSeek: (position: number) => void;
  syncMetronome: (enabled: boolean, newBpm?: number) => void;
  setBpm: (bpm: number) => void;
}

/**
 * Coordonne la synchronisation du lecteur audio et du métronome
 * entre co-auteurs connectés en mode Session Studio (FR-037).
 */
export function useStudioSession({
  realtime,
  player,
  initialBpm = 90,
}: UseStudioSessionOptions): UseStudioSessionResult {
  const [isStudioActive, setIsStudioActive] = useState(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [bpm, setBpmState] = useState(initialBpm);
  const [lastActorId, setLastActorId] = useState<string | null>(null);

  const isStudioActiveRef = useRef(isStudioActive);
  useEffect(() => {
    isStudioActiveRef.current = isStudioActive;
  }, [isStudioActive]);

  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  const bpmRef = useRef(bpm);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  // Écoute des transports distants
  useEffect(() => {
    const unsubscribeTransport = realtime.subscribeStudioTransport((msg) => {
      if (!isStudioActiveRef.current) {
        return;
      }

      setLastActorId(msg.actorId);

      if (msg.bpm && msg.bpm !== bpmRef.current) {
        setBpmState(msg.bpm);
      }

      if (msg.action === 'seek') {
        playerRef.current.seek(msg.position);
      } else if (msg.action === 'play') {
        playerRef.current.seek(msg.position);
        playerRef.current.play();
      } else if (msg.action === 'pause') {
        playerRef.current.seek(msg.position);
        playerRef.current.pause();
      }
    });

    const unsubscribeMetronome = realtime.subscribeStudioMetronome((msg) => {
      if (!isStudioActiveRef.current) {
        return;
      }

      setLastActorId(msg.actorId);
      setMetronomeEnabled(msg.isEnabled);
      setBpmState(msg.bpm);
    });

    return () => {
      unsubscribeTransport();
      unsubscribeMetronome();
    };
  }, [realtime]);

  const toggleStudioMode = useCallback(() => {
    setIsStudioActive((prev) => !prev);
  }, []);

  const syncPlay = useCallback(
    (position?: number) => {
      const pos = position ?? playerRef.current.currentTime;
      playerRef.current.seek(pos);
      playerRef.current.play();

      if (isStudioActiveRef.current) {
        realtime.sendStudioTransport('play', pos, bpmRef.current);
      }
    },
    [realtime],
  );

  const syncPause = useCallback(() => {
    playerRef.current.pause();

    if (isStudioActiveRef.current) {
      realtime.sendStudioTransport('pause', playerRef.current.currentTime, bpmRef.current);
    }
  }, [realtime]);

  const syncSeek = useCallback(
    (position: number) => {
      playerRef.current.seek(position);

      if (isStudioActiveRef.current) {
        realtime.sendStudioTransport('seek', position, bpmRef.current);
      }
    },
    [realtime],
  );

  const syncMetronome = useCallback(
    (enabled: boolean, newBpm?: number) => {
      const targetBpm = newBpm ?? bpmRef.current;
      setMetronomeEnabled(enabled);
      if (newBpm) {
        setBpmState(newBpm);
      }

      if (isStudioActiveRef.current) {
        realtime.sendStudioMetronome(enabled, targetBpm);
      }
    },
    [realtime],
  );

  const setBpm = useCallback(
    (newBpm: number) => {
      setBpmState(newBpm);
      if (isStudioActiveRef.current && metronomeEnabled) {
        realtime.sendStudioMetronome(metronomeEnabled, newBpm);
      }
    },
    [isStudioActive, metronomeEnabled, realtime],
  );

  return {
    isStudioActive,
    toggleStudioMode,
    metronomeEnabled,
    bpm,
    lastActorId,
    syncPlay,
    syncPause,
    syncSeek,
    syncMetronome,
    setBpm,
  };
}
