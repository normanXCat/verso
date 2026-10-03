import React from 'react';
import { Star } from 'lucide-react';
import type { SongListItem } from '@verso/shared';
import { Card } from '../ui/Card.js';
import { Tag } from '../ui/Tag.js';

interface SongCardProps {
  song: SongListItem;
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
 * Carte d'un texte : titre, statut, extrait de paroles, tags et métadonnées.
 */
export function SongCard({ song }: SongCardProps): React.ReactElement {
  const isCompleted = song.status === 'COMPLETED';

  return (
    <Card interactive className="flex h-full flex-col gap-3 notebook-ruled">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-xl leading-snug text-paper-text">{song.title}</h3>
        <div className="flex shrink-0 items-center gap-1.5">
          {song.isFavorite && (
            <Star
              className="h-3.5 w-3.5 fill-paper-accent text-paper-accent"
              aria-label="Texte favori"
            />
          )}
          <Tag variant={isCompleted ? 'success' : 'draft'} mono>
            {isCompleted ? 'Terminé' : 'Brouillon'}
          </Tag>
        </div>
      </div>

      {song.excerpt ? (
        <p className="line-clamp-2 text-sm leading-relaxed text-paper-muted">{song.excerpt}</p>
      ) : (
        <p className="text-sm italic text-paper-muted/70">Texte encore vierge.</p>
      )}

      {song.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {song.tags.map((tag) => (
            <Tag key={tag} variant="neutral">
              {tag}
            </Tag>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-paper-border/60 pt-2 text-[11px] font-mono text-paper-muted">
        <span className="truncate">{song.albumTitle ?? 'Sans album'}</span>
        <span className="shrink-0">Modifié le {formatDate(song.updatedAt)}</span>
      </div>
    </Card>
  );
}
