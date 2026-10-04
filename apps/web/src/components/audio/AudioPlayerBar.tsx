import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Loader2,
  Music,
  Pause,
  Play,
  Repeat,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import { MAX_AUDIO_SIZE_BYTES, type InstrumentalItem } from '@verso/shared';
import { audioClient, inferAudioMimeType, uploadToPresignedUrl } from '../../lib/audio-client.js';
import { useAudioPlayer } from '../../hooks/useAudioPlayer.js';

interface AudioPlayerBarProps {
  songId: string;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^./\\]+$/, '');
}

/**
 * Barre de lecture audio intégrée à l'éditeur : gestion des instrumentales
 * (téléversement présigné, sélection de piste active, suppression),
 * boucle d'une section et métronome synchronisé.
 */
export function AudioPlayerBar({
  songId,
  className = '',
}: AudioPlayerBarProps): React.ReactElement {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    data: instrumentals = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['instrumentals', songId],
    queryFn: () => audioClient.list(songId),
    enabled: songId.length > 0,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [bpmInput, setBpmInput] = useState('90');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeInstrumental =
    instrumentals.find((item) => item.id === selectedId) ??
    instrumentals.find((item) => item.isActive) ??
    instrumentals[0] ??
    null;

  // Synchronise le BPM local avec la piste sélectionnée.
  useEffect(() => {
    if (activeInstrumental) {
      setBpmInput(String(activeInstrumental.bpm ?? 90));
    }
  }, [activeInstrumental?.id, activeInstrumental?.bpm]); // Mémoïse la région pour ne pas relancer l'effet de boucle à chaque "timeupdate".
  const loopRegion = useMemo(
    () => (loopEnabled && loopEnd > loopStart ? { start: loopStart, end: loopEnd } : null),
    [loopEnabled, loopStart, loopEnd],
  );

  const player = useAudioPlayer({
    src: activeInstrumental?.downloadUrl ?? null,
    bpm: Number(bpmInput) || null,
    metronomeEnabled,
    loopRegion,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof audioClient.update>[1] }) =>
      audioClient.update(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instrumentals', songId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => audioClient.remove(id),
    onSuccess: () => {
      setSelectedId(null);
      void queryClient.invalidateQueries({ queryKey: ['instrumentals', songId] });
    },
  });

  const handleSelect = (item: InstrumentalItem): void => {
    setSelectedId(item.id);
    if (!item.isActive) {
      updateMutation.mutate({ id: item.id, patch: { isActive: true } });
    }
  };

  const commitBpm = (): void => {
    const parsed = Number(bpmInput);
    if (
      activeInstrumental &&
      Number.isInteger(parsed) &&
      parsed >= 20 &&
      parsed <= 300 &&
      parsed !== activeInstrumental.bpm
    ) {
      updateMutation.mutate({ id: activeInstrumental.id, patch: { bpm: parsed } });
    }
  };

  const handleDelete = (item: InstrumentalItem): void => {
    if (window.confirm(`Supprimer « ${item.title} » ? Cette action est irréversible.`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const handleFile = async (file: File): Promise<void> => {
    setMessage(null);
    const mimeType = inferAudioMimeType(file);
    if (!mimeType) {
      setMessage('Format non supporté : seuls MP3 et WAV sont acceptés.');
      return;
    }
    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      setMessage('Fichier trop volumineux : la limite est de 75 Mo.');
      return;
    }

    try {
      setUploadProgress(0);
      const { uploadUrl, s3Key } = await audioClient.requestUploadUrl(songId, {
        filename: file.name,
        mimeType,
        sizeBytes: file.size,
      });
      await uploadToPresignedUrl(uploadUrl, file, setUploadProgress);
      const created = await audioClient.confirm(songId, {
        s3Key,
        title: stripExtension(file.name) || 'Instrumentale',
        mimeType,
        sizeBytes: file.size,
      });
      setSelectedId(created.id);
      await queryClient.invalidateQueries({ queryKey: ['instrumentals', songId] });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Téléversement impossible.');
    } finally {
      setUploadProgress(null);
    }
  };

  return (
    <section
      className={`rounded-card border border-paper-border bg-paper-surface p-4 shadow-paper-sm ${className}`}
      aria-label="Lecteur audio"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-paper-accent" aria-hidden="true" />
          <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-paper-muted">
            Instrumentales
          </h2>
          <span className="text-[11px] font-mono text-paper-muted/70">
            {instrumentals.length}/3
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/wav,.mp3,.wav"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) {
                void handleFile(file);
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={instrumentals.length >= 3 || uploadProgress !== null}
            className="inline-flex items-center gap-1.5 rounded-paper border border-paper-border bg-paper-surface px-2.5 py-1.5 text-xs text-paper-muted transition-colors hover:text-paper-accent disabled:opacity-40"
          >
            {uploadProgress !== null ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {uploadProgress !== null ? `Téléversement ${uploadProgress}%` : 'Ajouter'}
          </button>
        </div>
      </div>

      {message && (
        <p className="mt-2 rounded-paper border border-paper-accent/40 bg-paper-accent/5 px-2.5 py-1.5 text-xs text-paper-accent">
          {message}
        </p>
      )}

      {isLoading ? (
        <p className="mt-3 text-xs text-paper-muted" aria-busy="true">
          Chargement des instrumentales…
        </p>
      ) : isError ? (
        <p className="mt-3 text-xs text-paper-accent">
          Impossible de charger les instrumentales pour le moment.
        </p>
      ) : instrumentals.length === 0 ? (
        <p className="mt-3 text-xs italic text-paper-muted/70">
          Ajoutez une instrumentale (MP3 ou WAV, 75 Mo max) pour écrire en rythme.
        </p>
      ) : (
        <>
          {/* Sélecteur de piste */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {instrumentals.map((item) => {
              const isSelected = item.id === activeInstrumental?.id;
              return (
                <div key={item.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    aria-pressed={isSelected}
                    className={`max-w-[16rem] truncate rounded-l-paper border px-2.5 py-1 text-xs transition-colors ${
                      isSelected
                        ? 'border-paper-accent bg-paper-accent/5 text-paper-accent'
                        : 'border-paper-border bg-paper-surface text-paper-muted hover:text-paper-text'
                    }`}
                    title={item.title}
                  >
                    {item.isActive && <span className="mr-1 text-paper-accent">●</span>}
                    {item.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    aria-label={`Supprimer ${item.title}`}
                    className="rounded-r-paper border border-l-0 border-paper-border bg-paper-surface px-1.5 py-1 text-paper-muted transition-colors hover:text-paper-accent"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Transport */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={player.toggle}
              disabled={!player.isReady}
              aria-label={player.isPlaying ? 'Mettre en pause' : 'Lire'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-paper-border bg-paper-surface text-paper-text transition-colors hover:border-paper-accent hover:text-paper-accent disabled:opacity-40"
            >
              {player.isPlaying ? (
                <Pause className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <span className="font-mono text-[11px] text-paper-muted">
              {formatTime(player.currentTime)} /{' '}
              {formatTime(player.duration || activeInstrumental?.durationSeconds || 0)}
            </span>

            <input
              type="range"
              min={0}
              max={player.duration || activeInstrumental?.durationSeconds || 0}
              step={0.1}
              value={Math.min(player.currentTime, player.duration || 0)}
              onChange={(event) => player.seek(Number(event.target.value))}
              aria-label="Position de lecture"
              className="h-1 flex-1 min-w-[8rem] cursor-pointer accent-[var(--color-accent)]"
            />

            <label className="flex items-center gap-1.5 text-[11px] font-mono text-paper-muted">
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={player.volume}
                onChange={(event) => player.setVolume(Number(event.target.value))}
                aria-label="Volume"
                className="h-1 w-20 cursor-pointer accent-[var(--color-accent)]"
              />
            </label>
          </div>

          {/* Boucle et métronome */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-paper-border pt-3">
            <label className="flex items-center gap-1.5 text-xs text-paper-muted">
              <input
                type="checkbox"
                checked={loopEnabled}
                onChange={(event) => setLoopEnabled(event.target.checked)}
                className="accent-[var(--color-accent)]"
              />
              <Repeat className="h-3.5 w-3.5" aria-hidden="true" />
              Boucle
            </label>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-paper-muted">
              <button
                type="button"
                onClick={() => setLoopStart(player.currentTime)}
                className="rounded-paper border border-paper-border px-2 py-0.5 transition-colors hover:text-paper-accent"
              >
                Début {formatTime(loopStart)}
              </button>
              <button
                type="button"
                onClick={() => setLoopEnd(player.currentTime)}
                className="rounded-paper border border-paper-border px-2 py-0.5 transition-colors hover:text-paper-accent"
              >
                Fin {formatTime(loopEnd)}
              </button>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-paper-muted">
              <input
                type="checkbox"
                checked={metronomeEnabled}
                onChange={(event) => setMetronomeEnabled(event.target.checked)}
                className="accent-[var(--color-accent)]"
              />
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              Métronome
            </label>

            <label className="flex items-center gap-1.5 text-xs text-paper-muted">
              BPM
              <input
                type="number"
                min={20}
                max={300}
                value={bpmInput}
                onChange={(event) => setBpmInput(event.target.value)}
                onBlur={commitBpm}
                aria-label="BPM de l'instrumentale"
                className="w-16 rounded-paper border border-paper-border bg-paper-surface px-1.5 py-0.5 text-right font-mono text-[11px] text-paper-text focus:border-paper-accent focus:outline-none"
              />
            </label>
          </div>

          {player.hasError && (
            <p className="mt-2 text-[11px] text-paper-accent">
              Lecture impossible : l'URL signée a peut-être expiré. Rechargez la page.
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default AudioPlayerBar;
