import { useCallback, useEffect, useRef, useState } from 'react';

export interface AudioLoopRegion {
  start: number;
  end: number;
}

export interface UseAudioPlayerOptions {
  /** URL signée de la piste à lire (`null` si aucune piste sélectionnée). */
  src: string | null;
  /** BPM utilisé par le métronome. */
  bpm?: number | null;
  /** Active le métronome synchronisé sur la lecture. */
  metronomeEnabled: boolean;
  /** Région de boucle (en secondes) ; `null` pour une lecture linéaire. */
  loopRegion: AudioLoopRegion | null;
}

export interface UseAudioPlayerResult {
  isPlaying: boolean;
  isReady: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  hasError: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  setVolume: (value: number) => void;
}

/** Programme un clic de métronome court (oscillateur + enveloppe) à l'instant donné. */
function scheduleMetronomeClick(ctx: AudioContext, time: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 1000;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.4, time + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.06);
}

/**
 * Lecture d'une instrumentale via une balise `<audio>` (flux S3 présigné),
 * avec bouclage précis d'une section (start/end) et métronome Web Audio
 * planifié par anticipation pour rester aligné sur l'horloge audio.
 */
export function useAudioPlayer({
  src,
  bpm,
  metronomeEnabled,
  loopRegion,
}: UseAudioPlayerOptions): UseAudioPlayerResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [hasError, setHasError] = useState(false);

  if (audioRef.current === null && typeof Audio !== 'undefined') {
    audioRef.current = new Audio();
    audioRef.current.preload = 'metadata';
  }

  const getAudioContext = useCallback((): AudioContext => {
    if (audioCtxRef.current === null) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  // Branchement des événements de la balise audio (une seule fois).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const handleLoadedMetadata = (): void => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setIsReady(true);
    };
    const handleTimeUpdate = (): void => setCurrentTime(audio.currentTime);
    const handlePlay = (): void => setIsPlaying(true);
    const handlePause = (): void => setIsPlaying(false);
    const handleEnded = (): void => setIsPlaying(false);
    const handleError = (): void => {
      setHasError(true);
      setIsReady(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Changement de piste : réinitialise la lecture.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    setIsPlaying(false);
    setIsReady(false);
    setHasError(false);
    setCurrentTime(0);
    setDuration(0);

    if (src) {
      audio.src = src;
      audio.load();
    } else {
      audio.removeAttribute('src');
    }
  }, [src]);

  // Volume.
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Bouclage de section : dès que la tête de lecture dépasse la fin, retour au début.
  useEffect(() => {
    if (!isPlaying || !loopRegion) {
      return;
    }
    let frame = 0;
    const tick = (): void => {
      const audio = audioRef.current;
      if (audio && audio.currentTime >= loopRegion.end) {
        audio.currentTime = loopRegion.start;
        setCurrentTime(loopRegion.start);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, loopRegion]);

  // Métronome synchronisé (planification par anticipation sur l'horloge audio).
  useEffect(() => {
    if (!isPlaying || !metronomeEnabled || !bpm || bpm <= 0) {
      return;
    }

    const ctx = getAudioContext();
    void ctx.resume();

    const beatSeconds = 60 / bpm;
    const lookahead = 0.1;
    let nextClickTime = ctx.currentTime + lookahead;

    const scheduler = window.setInterval(() => {
      while (nextClickTime < ctx.currentTime + lookahead) {
        scheduleMetronomeClick(ctx, nextClickTime);
        nextClickTime += beatSeconds;
      }
    }, 25);

    return () => window.clearInterval(scheduler);
  }, [isPlaying, metronomeEnabled, bpm, getAudioContext]);

  // Libération des ressources audio au démontage.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      void audioCtxRef.current?.close();
    };
  }, []);

  const play = useCallback((): void => {
    const audio = audioRef.current;
    if (!audio || !audio.src) {
      return;
    }
    void audio.play().catch(() => setHasError(true));
  }, []);

  const pause = useCallback((): void => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback((): void => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const seek = useCallback((time: number): void => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((value: number): void => {
    setVolumeState(Math.min(1, Math.max(0, value)));
  }, []);

  return {
    isPlaying,
    isReady,
    currentTime,
    duration,
    volume,
    hasError,
    play,
    pause,
    toggle,
    seek,
    setVolume,
  };
}
