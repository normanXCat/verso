import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Disc3, PenLine, Plus, Search } from 'lucide-react';
import type { SongFilter } from '@verso/shared';
import { songsClient } from '../lib/songs-client.js';
import { albumsClient } from '../lib/albums-client.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Modal } from '../components/ui/Modal.js';
import { useAuth } from '../hooks/useAuth.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useToast } from '../components/ui/Toast.js';
import { ThemeSwitch } from '../components/common/ThemeSwitch.js';
import { FilterBar } from '../components/dashboard/FilterBar.js';
import { SongCard } from '../components/dashboard/SongCard.js';
import { AlbumCard } from '../components/album/AlbumCard.js';

function SkeletonGrid(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div
          key={index}
          className="h-44 animate-pulse rounded-card border border-paper-border bg-paper-surface/70"
        />
      ))}
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-paper-border bg-paper-surface/50 px-6 py-16 text-center">
      <PenLine className="mb-4 h-6 w-6 text-paper-accent" aria-hidden="true" />
      <p className="font-serif text-2xl text-paper-text">
        {hasQuery ? 'Aucun texte ne correspond' : 'Votre carnet est encore vierge'}
      </p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-paper-muted">
        {hasQuery
          ? 'Essayez un autre mot-clé ou changez de filtre.'
          : 'Vos textes apparaîtront ici dès que vous commencerez à écrire.'}
      </p>
    </div>
  );
}

/**
 * Espace personnel : recherche plein texte en direct (debounce 200 ms) et
 * filtres combinables sur les textes de l'utilisateur.
 */
export function DashboardPage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<SongFilter>('all');
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const debouncedTerm = useDebouncedValue(searchTerm, 200);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['songs', 'search', { q: debouncedTerm, filter }],
    queryFn: () => songsClient.search({ q: debouncedTerm, filter, sort: 'recent' }),
    staleTime: 30_000,
  });

  const { data: albums } = useQuery({
    queryKey: ['albums', 'list'],
    queryFn: () => albumsClient.list(),
    staleTime: 30_000,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const createSong = useMutation({
    mutationFn: () => songsClient.create({}),
    onSuccess: (song) => {
      void queryClient.invalidateQueries({ queryKey: ['songs', 'search'] });
      navigate(`/app/songs/${song.id}`);
    },
  });

  const createAlbum = useMutation({
    mutationFn: () =>
      albumsClient.create({
        title: albumTitle.trim(),
        description: albumDescription.trim() || undefined,
      }),
    onSuccess: (album) => {
      void queryClient.invalidateQueries({ queryKey: ['albums', 'list'] });
      setIsAlbumModalOpen(false);
      setAlbumTitle('');
      setAlbumDescription('');
      navigate(`/app/albums/${album.id}`);
    },
    onError: () => toast("Impossible de créer l'album.", 'error'),
  });

  return (
    <div className="paper-grain min-h-screen bg-paper-bg text-paper-text">
      <header className="border-b border-paper-border bg-paper-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10">
          <Link to="/" className="group flex items-baseline gap-1">
            <span className="font-serif text-2xl text-paper-text transition-colors group-hover:text-paper-accent">
              Verso
            </span>
            <span className="inline-block h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-paper-accent" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-mono text-paper-muted sm:inline">
              {user?.displayName || user?.email}
            </span>
            <Link
              to="/sessions"
              className="text-xs font-mono text-paper-muted hover:text-paper-text transition-colors"
            >
              Sessions
            </Link>
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 md:px-10">
        {' '}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-paper-accent">
              Espace personnel
            </p>
            <h1 className="font-serif text-4xl leading-tight tracking-tight md:text-5xl">
              Mon carnet
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-paper-muted">
              Retrouvez, filtrez et relisez vos textes. La recherche parcourt les titres et les
              paroles en direct.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsAlbumModalOpen(true)}
            >
              <Disc3 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Nouvel album
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => createSong.mutate()}
              isLoading={createSong.isPending}
              loadingText="Création…"
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Nouveau texte
            </Button>
          </div>
        </div>
        {/* Albums */}
        {albums && albums.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xs font-mono uppercase tracking-[0.2em] text-paper-muted">
              Albums
            </h2>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((album) => (
                <li key={album.id} className="h-full">
                  <AlbumCard album={album} />
                </li>
              ))}
            </ul>
          </section>
        )}
        {/* Recherche plein texte en direct */}
        <div className="mb-5 flex items-center gap-3 border-b border-paper-border pb-2 transition-colors focus-within:border-paper-accent">
          <Search className="h-4 w-4 shrink-0 text-paper-muted" aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher un titre ou une rime…"
            aria-label="Rechercher dans mes textes"
            className="w-full bg-transparent py-2 text-sm text-paper-text placeholder:text-paper-muted/70 focus:outline-none"
          />
          {isFetching && !isLoading && (
            <span className="text-[11px] font-mono text-paper-muted" aria-hidden="true">
              …
            </span>
          )}
        </div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <FilterBar value={filter} onChange={setFilter} />
          <span className="text-xs font-mono text-paper-muted" aria-live="polite">
            {total} texte{total > 1 ? 's' : ''}
          </span>
        </div>
        {isLoading ? (
          <SkeletonGrid />
        ) : isError ? (
          <div className="rounded-card border border-paper-accent/40 bg-paper-accent/5 p-6 text-sm text-paper-accent">
            Impossible de charger vos textes pour le moment. Réessayez dans un instant.
          </div>
        ) : items.length === 0 ? (
          <EmptyState hasQuery={debouncedTerm.length > 0 || filter !== 'all'} />
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((song) => (
              <li key={song.id} className="h-full">
                <SongCard song={song} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <Modal
        isOpen={isAlbumModalOpen}
        onClose={() => setIsAlbumModalOpen(false)}
        title="Nouvel album"
        description="Regroupez plusieurs textes sous une même œuvre."
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (albumTitle.trim().length === 0) {
              return;
            }
            createAlbum.mutate();
          }}
        >
          <Input
            label="Titre de l'album"
            value={albumTitle}
            onChange={(event) => setAlbumTitle(event.target.value)}
            maxLength={200}
            autoFocus
          />
          <div className="space-y-1.5">
            <label
              htmlFor="album-description"
              className="text-xs font-mono uppercase tracking-wide text-paper-muted"
            >
              Description (optionnelle)
            </label>
            <textarea
              id="album-description"
              value={albumDescription}
              onChange={(event) => setAlbumDescription(event.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Projet, intention, date…"
              className="w-full resize-none rounded-paper border border-paper-border bg-paper-bg px-3 py-2 text-sm text-paper-text placeholder:text-paper-muted/60 focus:border-paper-accent focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAlbumModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={albumTitle.trim().length === 0}
              isLoading={createAlbum.isPending}
              loadingText="Création…"
            >
              Créer l'album
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DashboardPage;
