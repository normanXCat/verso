import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Disc3, ListMusic } from 'lucide-react';
import type { AlbumListItem } from '@verso/shared';
import { Card } from '../ui/Card.js';

interface AlbumCardProps {
  album: AlbumListItem;
}

/**
 * Carte d'un album dans l'espace personnel :
 * - Entièrement cliquable via le lien étiré sur le titre ET gestionnaire onClick de secours sur la carte.
 * - Aucune imbrication invalide de balises interactives.
 * - Décorations en pointer-events: none.
 */
export function AlbumCard({ album }: AlbumCardProps): React.ReactElement {
  const navigate = useNavigate();

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if ((event.target as HTMLElement).closest('button, [role="button"]')) {
      return;
    }
    if ((event.target as HTMLElement).closest('a')) {
      return;
    }
    navigate(`/app/albums/${album.id}`);
  };

  return (
    <Card
      interactive
      onClick={handleCardClick}
      className="group relative flex h-full flex-col gap-3 cursor-pointer focus-within:ring-2 focus-within:ring-paper-accent focus-within:ring-offset-2 focus-within:ring-offset-paper-bg"
    >
      <div className="pointer-events-none flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-paper border border-paper-border bg-paper-bg text-paper-accent"
          aria-hidden="true"
        >
          <Disc3 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="pointer-events-auto truncate font-serif text-xl leading-snug text-paper-text group-hover:text-paper-accent transition-colors">
            <Link
              to={`/app/albums/${album.id}`}
              className="rounded-xs focus:outline-none after:block after:absolute after:inset-0 after:z-0 after:cursor-pointer after:content-['']"
            >
              {album.title}
            </Link>
          </h3>
          <p className="text-[11px] font-mono uppercase tracking-wide text-paper-muted">Album</p>
        </div>
      </div>

      {album.description ? (
        <p className="pointer-events-none line-clamp-2 text-sm leading-relaxed text-paper-muted">
          {album.description}
        </p>
      ) : (
        <p className="pointer-events-none text-sm italic text-paper-muted/70">
          Aucune description.
        </p>
      )}

      <div className="pointer-events-none mt-auto flex items-center gap-1.5 border-t border-paper-border/60 pt-2 text-[11px] font-mono text-paper-muted">
        <ListMusic className="h-3.5 w-3.5" aria-hidden="true" />
        {album.tracksCount} piste{album.tracksCount > 1 ? 's' : ''}
      </div>
    </Card>
  );
}
