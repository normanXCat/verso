import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { cleanExcerpt, type SongListItem } from '@verso/shared';
import { Card } from '../ui/Card.js';
import { Tag } from '../ui/Tag.js';
import { songsClient } from '../../lib/songs-client.js';

export interface SongCardProps {
  song: SongListItem;
  onToggleFavorite?: (song: SongListItem) => void;
  onToggleStatus?: (song: SongListItem) => void;
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return dateFormatter.format(date);
}

/**
 * Carte d'un texte :
 * - Entièrement cliquable via la technique du « lien étiré » (pseudo-élément ::after sur le titre).
 * - Actions secondaires (favori, statut) en boutons au-dessus (z-index supérieur) sans déclencher la navigation.
 * - Extrait nettoyé du Markdown brut et exempt de tout HTML injecté.
 * - Respect des tokens du design system et du contraste WCAG AA.
 */
export function SongCard({
  song,
  onToggleFavorite,
  onToggleStatus,
}: SongCardProps): React.ReactElement {
  const queryClient = useQueryClient();
  const isCompleted = song.status === 'COMPLETED';

  const defaultFavoriteMutation = useMutation({
    mutationFn: (nextFavorite: boolean) =>
      songsClient.update(song.id, { isFavorite: nextFavorite }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['songs', 'search'] });
    },
  });

  const defaultStatusMutation = useMutation({
    mutationFn: (nextStatus: 'DRAFT' | 'COMPLETED') =>
      songsClient.update(song.id, { status: nextStatus }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['songs', 'search'] });
    },
  });

  const handleFavoriteClick = (event: React.MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(song);
    } else {
      defaultFavoriteMutation.mutate(!song.isFavorite);
    }
  };

  const handleStatusClick = (event: React.MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    if (onToggleStatus) {
      onToggleStatus(song);
    } else {
      defaultStatusMutation.mutate(isCompleted ? 'DRAFT' : 'COMPLETED');
    }
  };

  const excerptText = cleanExcerpt(song.excerpt);

  return (
    <Card
      interactive
      className="group relative flex h-full flex-col gap-3 notebook-ruled focus-within:ring-2 focus-within:ring-paper-accent focus-within:ring-offset-2 focus-within:ring-offset-paper-bg"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-xl leading-snug text-paper-text group-hover:text-paper-accent transition-colors">
          <Link
            to={`/app/songs/${song.id}`}
            className="rounded-xs focus:outline-none after:absolute after:inset-0 after:z-0 after:content-['']"
          >
            {song.title}
          </Link>
        </h3>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label={song.isFavorite ? 'Retirer des favoris' : 'Marquer comme favori'}
            title={song.isFavorite ? 'Retirer des favoris' : 'Marquer comme favori'}
            className="relative z-10 rounded p-1 text-paper-muted transition-colors hover:text-paper-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-accent"
          >
            <Star
              className={`h-4 w-4 transition-colors ${
                song.isFavorite
                  ? 'fill-paper-accent text-paper-accent'
                  : 'text-paper-muted hover:text-paper-accent'
              }`}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={handleStatusClick}
            aria-label={isCompleted ? 'Marquer comme brouillon' : 'Marquer comme terminé'}
            title={isCompleted ? 'Marquer comme brouillon' : 'Marquer comme terminé'}
            className="relative z-10 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-accent"
          >
            <Tag variant={isCompleted ? 'success' : 'draft'} mono>
              {isCompleted ? 'Terminé' : 'Brouillon'}
            </Tag>
          </button>
        </div>
      </div>

      {excerptText ? (
        <p className="pointer-events-none line-clamp-2 text-sm leading-relaxed text-paper-muted">
          {excerptText}
        </p>
      ) : (
        <p className="pointer-events-none text-sm italic text-paper-muted/70">
          Texte encore vierge.
        </p>
      )}

      {song.tags.length > 0 && (
        <div className="pointer-events-none flex flex-wrap gap-1.5">
          {song.tags.map((tag) => (
            <Tag key={tag} variant="neutral">
              {tag}
            </Tag>
          ))}
        </div>
      )}

      <div className="pointer-events-none mt-auto flex items-center justify-between border-t border-paper-border/60 pt-2 text-[11px] font-mono text-paper-muted">
        <span className="truncate">{song.albumTitle ?? 'Sans album'}</span>
        <span className="shrink-0">Modifié le {formatDate(song.updatedAt)}</span>
      </div>
    </Card>
  );
}
