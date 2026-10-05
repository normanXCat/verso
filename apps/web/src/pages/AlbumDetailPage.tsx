import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ListMusic, Plus, Trash2 } from 'lucide-react';
import type { AlbumDetail } from '@verso/shared';
import { albumsClient, AlbumsApiError } from '../lib/albums-client.js';
import { songsClient } from '../lib/songs-client.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { ThemeToggle } from '../components/common/ThemeToggle.js';
import { useToast } from '../components/ui/Toast.js';
import { SortableTracklist } from '../components/album/SortableTracklist.js';

/**
 * Vue d'un album : métadonnées éditables, tracklist réordonnable par
 * glisser-déposer et rattachement de textes existants.
 */
export function AlbumDetailPage(): React.ReactElement {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: album,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['albums', 'detail', id],
    queryFn: () => albumsClient.get(id),
    enabled: id.length > 0,
    retry: false,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initialised, setInitialised] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    if (!album || initialised) {
      return;
    }
    setTitle(album.title);
    setDescription(album.description ?? '');
    setInitialised(true);
  }, [album, initialised]);

  // Textes de l'utilisateur pouvant encore être rattachés à cet album.
  const { data: songsData, isLoading: isLoadingSongs } = useQuery({
    queryKey: ['songs', 'search', { albumPicker: true }],
    queryFn: () => songsClient.search({ sort: 'recent', limit: 100 }),
    enabled: isPickerOpen,
    staleTime: 10_000,
  });

  const trackIds = useMemo(() => new Set((album?.tracks ?? []).map((t) => t.id)), [album]);
  const candidates = (songsData?.items ?? []).filter((song) => !trackIds.has(song.id));

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['albums'] });
    void queryClient.invalidateQueries({ queryKey: ['songs', 'search'] });
  };

  const updateMutation = useMutation({
    mutationFn: (patch: { title?: string; description?: string | null }) =>
      albumsClient.update(id, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData<AlbumDetail>(['albums', 'detail', id], updated);
      invalidate();
    },
    onError: () => toast('Impossible de mettre à jour cet album.', 'error'),
  });

  const reorderMutation = useMutation({
    mutationFn: (songIds: string[]) => albumsClient.reorder(id, songIds),
    onSuccess: (updated) => {
      queryClient.setQueryData<AlbumDetail>(['albums', 'detail', id], updated);
      void queryClient.invalidateQueries({ queryKey: ['albums', 'list'] });
    },
    onError: () => {
      toast("L'ordre n'a pas pu être enregistré.", 'error');
      void queryClient.invalidateQueries({ queryKey: ['albums', 'detail', id] });
    },
  });

  const removeTrackMutation = useMutation({
    mutationFn: (songId: string) => albumsClient.removeTrack(id, songId),
    onSuccess: () => {
      invalidate();
      toast('Texte retiré de l’album (il est conservé dans votre carnet).', 'info');
    },
    onError: () => toast('Impossible de retirer ce texte.', 'error'),
  });

  const addTrackMutation = useMutation({
    mutationFn: (songId: string) => albumsClient.addTrack(id, songId),
    onSuccess: () => {
      invalidate();
      setIsPickerOpen(false);
      toast('Texte ajouté à la tracklist.', 'success');
    },
    onError: () => toast("Impossible d'ajouter ce texte.", 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => albumsClient.remove(id),
    onSuccess: () => {
      invalidate();
      toast('Album supprimé. Vos textes ont été conservés.', 'info');
      navigate('/app', { replace: true });
    },
    onError: () => toast('Impossible de supprimer cet album.', 'error'),
  });

  const commitTitle = (): void => {
    const trimmed = title.trim();
    if (!album || trimmed.length === 0) {
      setTitle(album?.title ?? title);
      return;
    }
    if (trimmed !== album.title) {
      updateMutation.mutate({ title: trimmed });
    }
    setTitle(trimmed);
  };

  const commitDescription = (): void => {
    if (!album) {
      return;
    }
    const trimmed = description.trim();
    const next = trimmed.length > 0 ? trimmed : null;
    if (next !== (album.description ?? null)) {
      updateMutation.mutate({ description: next });
    }
  };

  const handleDelete = (): void => {
    if (
      window.confirm(
        'Supprimer cet album ? Vos textes ne seront pas supprimés, ils seront simplement détachés.',
      )
    ) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="paper-grain min-h-screen bg-paper-bg text-paper-text">
      <header className="sticky top-0 z-30 border-b border-paper-border bg-paper-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3 md:px-10">
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-paper-muted transition-colors hover:text-paper-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Mon carnet
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              aria-label="Supprimer l'album"
              title="Supprimer l'album (les textes sont conservés)"
              className="rounded p-1.5 text-paper-muted transition-colors hover:text-paper-accent disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 md:px-10">
        {isLoading ? (
          <div
            className="h-64 animate-pulse rounded-card border border-paper-border bg-paper-surface/60"
            aria-busy="true"
          />
        ) : isError || !album ? (
          <div className="rounded-card border border-paper-accent/40 bg-paper-accent/5 p-6 text-sm text-paper-accent">
            {error instanceof AlbumsApiError && error.statusCode === 404
              ? 'Cet album est introuvable.'
              : 'Impossible de charger cet album pour le moment.'}
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-2">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-paper-accent">
                Album · {album.tracks.length} piste{album.tracks.length > 1 ? 's' : ''}
              </p>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={commitTitle}
                aria-label="Titre de l'album"
                placeholder="Titre de l'album"
                className="w-full bg-transparent font-serif text-4xl leading-tight tracking-tight text-paper-text placeholder:text-paper-muted/50 focus:outline-none md:text-5xl"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                onBlur={commitDescription}
                aria-label="Description de l'album"
                placeholder="Ajoutez une note, une intention, une date…"
                rows={2}
                maxLength={2000}
                className="w-full resize-none bg-transparent text-sm leading-relaxed text-paper-muted placeholder:text-paper-muted/60 focus:outline-none"
              />
            </div>

            <section className="rounded-card border border-paper-border bg-paper-surface p-5 shadow-paper-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 font-serif text-2xl text-paper-text">
                  <ListMusic className="h-5 w-5 text-paper-accent" aria-hidden="true" />
                  Tracklist
                </h2>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsPickerOpen(true)}
                >
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Ajouter un texte
                </Button>
              </div>

              <p className="mb-4 text-xs leading-relaxed text-paper-muted">
                Glissez-déposez les pistes pour définir l'ordre de l'album. Retirer une piste ne
                supprime jamais le texte : il retourne simplement dans votre carnet.
              </p>

              <SortableTracklist
                tracks={album.tracks}
                onReorder={(songIds) => reorderMutation.mutate(songIds)}
                onRemove={(songId) => removeTrackMutation.mutate(songId)}
                disabled={reorderMutation.isPending || removeTrackMutation.isPending}
              />
            </section>
          </>
        )}
      </main>

      <Modal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title="Ajouter un texte"
        description="Choisissez un texte de votre carnet à rattacher à cet album."
      >
        {isLoadingSongs ? (
          <div className="h-32 animate-pulse rounded-card bg-paper-bg" aria-busy="true" />
        ) : candidates.length === 0 ? (
          <p className="text-sm text-paper-muted">
            Aucun texte disponible. Tous vos textes sont déjà dans cet album.
          </p>
        ) : (
          <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
            {candidates.map((song) => (
              <li key={song.id}>
                <button
                  type="button"
                  disabled={addTrackMutation.isPending}
                  onClick={() => addTrackMutation.mutate(song.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-paper border border-paper-border bg-paper-bg px-3 py-2 text-left transition-colors hover:border-paper-accent disabled:opacity-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-base text-paper-text">
                      {song.title}
                    </span>
                    {song.albumTitle && (
                      <span className="block truncate text-[11px] font-mono text-paper-muted">
                        Déjà dans « {song.albumTitle} »
                      </span>
                    )}
                  </span>
                  <Plus className="h-4 w-4 shrink-0 text-paper-muted" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}

export default AlbumDetailPage;
