import React from 'react';
import { Link } from 'react-router-dom';
import { Disc3, ListMusic } from 'lucide-react';
import type { AlbumListItem } from '@verso/shared';
import { Card } from '../ui/Card.js';

interface AlbumCardProps {
  album: AlbumListItem;
}

/**
 * Carte d'un album dans l'espace personnel : titre, description et nombre de pistes.
 */
export function AlbumCard({ album }: AlbumCardProps): React.ReactElement {
  return (
    <Link to={`/app/albums/${album.id}`} className="block h-full">
      <Card interactive className="flex h-full flex-col gap-3">
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-paper border border-paper-border bg-paper-bg text-paper-accent"
            aria-hidden="true"
          >
            <Disc3 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-serif text-xl leading-snug text-paper-text">
              {album.title}
            </h3>
            <p className="text-[11px] font-mono uppercase tracking-wide text-paper-muted">Album</p>
          </div>
        </div>

        {album.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-paper-muted">
            {album.description}
          </p>
        ) : (
          <p className="text-sm italic text-paper-muted/70">Aucune description.</p>
        )}

        <div className="mt-auto flex items-center gap-1.5 border-t border-paper-border/60 pt-2 text-[11px] font-mono text-paper-muted">
          <ListMusic className="h-3.5 w-3.5" aria-hidden="true" />
          {album.tracksCount} piste{album.tracksCount > 1 ? 's' : ''}
        </div>
      </Card>
    </Link>
  );
}
