import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, History, Trash2 } from 'lucide-react';
import type { SongDetail, SongListItem, UpdateSongInput } from '@verso/shared';
import { songsClient, SongsApiError } from '../lib/songs-client.js';
import { readDraft } from '../lib/draft-storage.js';
import { useAutoSave } from '../hooks/useAutoSave.js';
import { ThemeSwitch } from '../components/common/ThemeSwitch.js';
import { LyricEditor } from '../components/editor/LyricEditor.js';
import { EditorMetricsBar } from '../components/editor/EditorMetricsBar.js';
import { SaveStatusIndicator } from '../components/editor/SaveStatusIndicator.js';
import { SongMetadataSidebar } from '../components/editor/SongMetadataSidebar.js';
import { VersionHistoryDrawer } from '../components/editor/VersionHistoryDrawer.js';
import { ZenModeToggle } from '../components/editor/ZenModeToggle.js';
import { AudioPlayerBar } from '../components/audio/AudioPlayerBar.js';

/**
 * Espace d'écriture d'un texte : éditeur épuré avec sauvegarde automatique,
 * compteurs en direct et métadonnées (statut, favori, tags).
 */
export function EditorPage(): React.ReactElement {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: song,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['songs', 'detail', id],
    queryFn: () => songsClient.get(id),
    enabled: id.length > 0,
    retry: false,
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [initialised, setInitialised] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isZen, setIsZen] = useState(false);

  // Initialise depuis le serveur, en priorisant un brouillon local non synchronisé.
  useEffect(() => {
    if (!song || initialised) {
      return;
    }
    const draft = readDraft(song.id);
    setTitle(song.title);
    setContent(draft ?? song.content);
    setInitialised(true);
  }, [song, initialised]);

  const autoSave = useAutoSave({
    songId: initialised ? id : null,
    content,
    enabled: initialised,
    baselineContent: song?.content,
  });

  const metadataMutation = useMutation({
    mutationFn: (patch: UpdateSongInput) => songsClient.update(id, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData<SongListItem>(['songs', 'detail', id], (previous) =>
        previous
          ? {
              ...previous,
              status: updated.status,
              isFavorite: updated.isFavorite,
              tags: updated.tags,
              albumId: updated.albumId,
              albumTitle: updated.albumTitle,
              updatedAt: updated.updatedAt,
            }
          : updated,
      );
      void queryClient.invalidateQueries({ queryKey: ['songs', 'search'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => songsClient.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['songs', 'search'] });
      navigate('/app', { replace: true });
    },
  });

  const applyMetadata = (patch: UpdateSongInput): void => {
    queryClient.setQueryData<SongListItem>(['songs', 'detail', id], (previous) =>
      previous ? { ...previous, ...patch } : previous,
    );
    metadataMutation.mutate(patch);
  };

  const commitTitle = (): void => {
    const trimmed = title.trim();
    if (!song || trimmed.length === 0) {
      setTitle(song?.title ?? title);
      return;
    }
    if (trimmed !== song.title) {
      applyMetadata({ title: trimmed });
    }
    setTitle(trimmed);
  };

  const handleDelete = (): void => {
    if (window.confirm('Supprimer définitivement ce texte ? Cette action est irréversible.')) {
      deleteMutation.mutate();
    }
  };

  // Mode concentration : plein écran, interface réduite au seul texte (FR-033).
  const toggleZen = (): void => {
    const next = !isZen;
    setIsZen(next);
    if (next) {
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
    } else if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => undefined);
    }
  };

  // Synchronise l'état zen avec la sortie du plein écran (touche Échap).
  useEffect(() => {
    const handleFullscreenChange = (): void => {
      if (!document.fullscreenElement) {
        setIsZen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        void document.exitFullscreen?.();
      }
    };
  }, []);

  return (
    <div className="paper-grain min-h-screen bg-paper-bg text-paper-text">
      {!isZen && (
        <header className="sticky top-0 z-30 border-b border-paper-border bg-paper-surface/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3 md:px-10">
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-paper-muted transition-colors hover:text-paper-text"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Mon carnet
            </Link>
            <div className="flex items-center gap-3">
              <SaveStatusIndicator status={autoSave.status} />
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                aria-label="Ouvrir l'historique des versions"
                title="Historique des versions"
                className="rounded p-1.5 text-paper-muted transition-colors hover:text-paper-text"
              >
                <History className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                aria-label="Supprimer le texte"
                className="rounded p-1.5 text-paper-muted transition-colors hover:text-paper-accent disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
              <ZenModeToggle isActive={isZen} onToggle={toggleZen} />
              <ThemeSwitch />
            </div>
          </div>
        </header>
      )}

      {isZen && (
        <div className="fixed right-4 top-4 z-40">
          <ZenModeToggle
            isActive
            onToggle={toggleZen}
            className="rounded-full border border-paper-border bg-paper-surface/80 p-2 backdrop-blur"
          />
        </div>
      )}

      <main
        className={
          isZen ? 'mx-auto max-w-3xl px-6 py-16 md:px-10' : 'mx-auto max-w-5xl px-6 py-8 md:px-10'
        }
      >
        {isLoading ? (
          <div
            className="h-64 animate-pulse rounded-card border border-paper-border bg-paper-surface/60"
            aria-busy="true"
          />
        ) : isError || !song ? (
          <div className="rounded-card border border-paper-accent/40 bg-paper-accent/5 p-6 text-sm text-paper-accent">
            {error instanceof SongsApiError && error.statusCode === 404
              ? 'Ce texte est introuvable.'
              : 'Impossible de charger ce texte pour le moment.'}
          </div>
        ) : (
          <div className={isZen ? '' : 'grid grid-cols-1 gap-8 lg:grid-cols-[1fr_260px]'}>
            <section>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={commitTitle}
                aria-label="Titre du texte"
                placeholder="Titre du texte"
                className="w-full bg-transparent font-serif text-3xl text-paper-text placeholder:text-paper-muted/50 focus:outline-none md:text-4xl"
              />

              <div className="notebook-ruled mt-6 rounded-card border border-paper-border bg-paper-surface p-6 shadow-paper-sm">
                <LyricEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Posez vos premières rimes…"
                  ariaLabel="Paroles du texte"
                  className={isZen ? 'min-h-[60vh]' : 'min-h-[22rem]'}
                />
              </div>

              {!isZen && (
                <>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <EditorMetricsBar content={content} />
                    <span className="text-[11px] font-mono text-paper-muted">
                      Sauvegarde automatique active
                    </span>
                  </div>

                  <AudioPlayerBar songId={song.id} className="mt-6" />
                </>
              )}
            </section>

            {!isZen && (
              <SongMetadataSidebar
                song={song}
                onChange={applyMetadata}
                disabled={metadataMutation.isPending}
                className="lg:sticky lg:top-24 lg:self-start"
              />
            )}
          </div>
        )}
      </main>

      {song && (
        <VersionHistoryDrawer
          songId={song.id}
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onRestored={(restored) => {
            setTitle(restored.title);
            setContent(restored.content);
            queryClient.setQueryData<SongDetail>(['songs', 'detail', id], restored);
          }}
        />
      )}
    </div>
  );
}

export default EditorPage;
