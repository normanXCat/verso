import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PenLine, Search } from 'lucide-react';
import type { SongFilter } from '@verso/shared';
import { songsClient } from '../lib/songs-client.js';
import { useAuth } from '../hooks/useAuth.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { ThemeSwitch } from '../components/common/ThemeSwitch.js';
import { FilterBar } from '../components/dashboard/FilterBar.js';
import { SongCard } from '../components/dashboard/SongCard.js';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<SongFilter>('all');
  const debouncedTerm = useDebouncedValue(searchTerm, 200);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['songs', 'search', { q: debouncedTerm, filter }],
    queryFn: () => songsClient.search({ q: debouncedTerm, filter, sort: 'recent' }),
    staleTime: 30_000,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

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
        <div className="mb-8 flex flex-col gap-2">
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
    </div>
  );
}

export default DashboardPage;
