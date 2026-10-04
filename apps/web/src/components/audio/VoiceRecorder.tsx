import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Mic, Square, Trash2 } from 'lucide-react';
import type { VoiceNoteItem, VoiceNoteMimeType } from '@verso/shared';
import { MAX_VOICE_NOTE_SIZE_BYTES } from '@verso/shared';
import {
  audioClient,
  pickVoiceRecorderFormat,
  uploadToPresignedUrl,
} from '../../lib/audio-client.js';

interface VoiceRecorderProps {
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

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(value: Date | string): string {
  return dateFormatter.format(value instanceof Date ? value : new Date(value));
}

/**
 * Enregistreur de mémos vocaux freestyle (`MediaRecorder`) rattachés au texte :
 * capture micro, téléversement présigné S3, liste et suppression (FR-048).
 */
export function VoiceRecorder({ songId, className = '' }: VoiceRecorderProps): React.ReactElement {
  const queryClient = useQueryClient();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const {
    data: voiceNotes = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['voice-notes', songId],
    queryFn: () => audioClient.listVoiceNotes(songId),
    enabled: songId.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => audioClient.removeVoiceNote(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['voice-notes', songId] });
    },
    onError: () => setMessage('Suppression impossible pour le moment.'),
  });

  const clearTimer = (): void => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const releaseStream = (): void => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      releaseStream();
    };
  }, []);

  const uploadRecording = async (
    blob: Blob,
    durationSeconds: number,
    mimeType: VoiceNoteMimeType,
  ): Promise<void> => {
    if (blob.size > MAX_VOICE_NOTE_SIZE_BYTES) {
      setMessage('Enregistrement trop long : la limite est de 25 Mo.');
      return;
    }

    setIsUploading(true);
    setMessage(null);
    try {
      const { uploadUrl, s3Key } = await audioClient.requestVoiceUploadUrl(songId, {
        mimeType,
        sizeBytes: blob.size,
      });
      await uploadToPresignedUrl(
        uploadUrl,
        new File([blob], 'freestyle', { type: mimeType }),
        undefined,
      );
      await audioClient.confirmVoiceNote(songId, {
        s3Key,
        durationSeconds: durationSeconds > 0 ? Math.round(durationSeconds * 10) / 10 : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['voice-notes', songId] });
      setMessage('Mémo vocal attaché au texte.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Téléversement impossible.');
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async (): Promise<void> => {
    setMessage(null);
    const format = pickVoiceRecorderFormat();
    if (!format) {
      setMessage("L'enregistrement audio n'est pas supporté par ce navigateur.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("Le microphone n'est pas accessible sur cet appareil.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: format.recorderMimeType });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const duration = (Date.now() - startedAtRef.current) / 1000;
        const blob = new Blob(chunksRef.current, { type: format.mimeType });
        chunksRef.current = [];
        releaseStream();
        void uploadRecording(blob, duration, format.mimeType);
      };

      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start();
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed((Date.now() - startedAtRef.current) / 1000);
      }, 200);
    } catch {
      releaseStream();
      setMessage('Accès au microphone refusé ou indisponible.');
    }
  };

  const stopRecording = (): void => {
    clearTimer();
    setIsRecording(false);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      releaseStream();
    }
  };

  return (
    <section
      className={`rounded-card border border-paper-border bg-paper-surface p-4 shadow-paper-sm ${className}`}
      aria-label="Mémos vocaux"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-paper-accent" aria-hidden="true" />
          <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-paper-muted">
            Freestyles
          </h2>
          <span className="text-[11px] font-mono text-paper-muted/70">{voiceNotes.length}</span>
        </div>

        <button
          type="button"
          onClick={isRecording ? stopRecording : () => void startRecording()}
          disabled={isUploading}
          className={`inline-flex items-center gap-1.5 rounded-paper border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-40 ${
            isRecording
              ? 'border-paper-accent bg-paper-accent/10 text-paper-accent'
              : 'border-paper-border bg-paper-surface text-paper-muted hover:text-paper-accent'
          }`}
        >
          {isRecording ? (
            <Square className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Mic className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {isRecording ? `Arrêter ${formatTime(elapsed)}` : 'Enregistrer un freestyle'}
        </button>
      </div>

      {isUploading && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-paper-muted">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          Téléversement du mémo vocal…
        </p>
      )}

      {message && (
        <p className="mt-2 rounded-paper border border-paper-border bg-paper-bg px-2.5 py-1.5 text-xs text-paper-muted">
          {message}
        </p>
      )}

      {isLoading ? (
        <p className="mt-3 text-xs text-paper-muted" aria-busy="true">
          Chargement des mémos vocaux…
        </p>
      ) : isError ? (
        <p className="mt-3 text-xs text-paper-accent">
          Impossible de charger les mémos vocaux pour le moment.
        </p>
      ) : voiceNotes.length === 0 ? (
        <p className="mt-3 text-xs italic text-paper-muted/70">
          Enregistrez un freestyle ou un mémo de flow pour le garder avec votre texte.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {voiceNotes.map((note: VoiceNoteItem) => (
            <li
              key={note.id}
              className="flex flex-wrap items-center gap-3 rounded-card border border-paper-border bg-paper-bg px-3 py-2"
            >
              <span className="text-[11px] font-mono text-paper-muted">
                {note.durationSeconds != null ? formatTime(note.durationSeconds) : '—'} ·{' '}
                {formatDate(note.createdAt)}
              </span>
              {note.downloadUrl ? (
                <audio
                  controls
                  preload="none"
                  src={note.downloadUrl}
                  className="h-8 flex-1 min-w-[10rem]"
                >
                  <track kind="captions" />
                </audio>
              ) : (
                <span className="text-[11px] text-paper-muted">Lecture indisponible</span>
              )}
              <button
                type="button"
                onClick={() => deleteMutation.mutate(note.id)}
                disabled={deleteMutation.isPending}
                aria-label="Supprimer ce mémo vocal"
                className="rounded p-1.5 text-paper-muted transition-colors hover:text-paper-accent disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default VoiceRecorder;
