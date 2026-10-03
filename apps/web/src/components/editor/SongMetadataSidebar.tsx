import React, { useState } from 'react';
import { Plus, Star, X } from 'lucide-react';
import { MAX_TAGS_PER_SONG, type SongListItem, type UpdateSongInput } from '@verso/shared';
import { Tag } from '../ui/Tag.js';

interface SongMetadataSidebarProps {
  song: SongListItem;
  onChange: (patch: UpdateSongInput) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Barre latérale des métadonnées d'un texte : statut (brouillon / terminé),
 * marquage favori et gestion des tags personnalisés.
 */
export function SongMetadataSidebar({
  song,
  onChange,
  disabled = false,
  className = '',
}: SongMetadataSidebarProps): React.ReactElement {
  const [tagInput, setTagInput] = useState('');
  const isCompleted = song.status === 'COMPLETED';

  const addTag = (event: React.FormEvent): void => {
    event.preventDefault();
    const name = tagInput.trim();
    setTagInput('');

    if (!name || song.tags.includes(name) || song.tags.length >= MAX_TAGS_PER_SONG) {
      return;
    }
    onChange({ tags: [...song.tags, name] });
  };

  const removeTag = (name: string): void => {
    onChange({ tags: song.tags.filter((tag) => tag !== name) });
  };

  return (
    <aside className={`space-y-6 ${className}`} aria-label="Métadonnées du texte">
      {/* Statut */}
      <section className="space-y-2">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-paper-muted">
          Statut
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled}
            aria-pressed={!isCompleted}
            onClick={() => onChange({ status: 'DRAFT' })}
            className={`flex-1 rounded-paper border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
              !isCompleted
                ? 'border-paper-accent bg-paper-accent/5 text-paper-accent'
                : 'border-paper-border bg-paper-surface text-paper-muted hover:text-paper-text'
            }`}
          >
            Brouillon
          </button>
          <button
            type="button"
            disabled={disabled}
            aria-pressed={isCompleted}
            onClick={() => onChange({ status: 'COMPLETED' })}
            className={`flex-1 rounded-paper border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
              isCompleted
                ? 'border-emerald-700/40 bg-emerald-950/10 text-emerald-600 dark:text-emerald-400'
                : 'border-paper-border bg-paper-surface text-paper-muted hover:text-paper-text'
            }`}
          >
            Terminé
          </button>
        </div>
      </section>

      {/* Favori */}
      <section className="space-y-2">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-paper-muted">
          Favori
        </h2>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={song.isFavorite}
          onClick={() => onChange({ isFavorite: !song.isFavorite })}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-paper border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
            song.isFavorite
              ? 'border-paper-accent bg-paper-accent/5 text-paper-accent'
              : 'border-paper-border bg-paper-surface text-paper-muted hover:text-paper-text'
          }`}
        >
          <Star
            className={`h-3.5 w-3.5 ${song.isFavorite ? 'fill-paper-accent text-paper-accent' : ''}`}
            aria-hidden="true"
          />
          {song.isFavorite ? 'Retirer des favoris' : 'Marquer comme favori'}
        </button>
      </section>

      {/* Tags */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-paper-muted">Tags</h2>

        <div className="flex flex-wrap gap-1.5">
          {song.tags.length === 0 ? (
            <p className="text-xs italic text-paper-muted/70">Aucun tag pour ce texte.</p>
          ) : (
            song.tags.map((tag) => (
              <Tag key={tag} variant="neutral" className="pr-1">
                {tag}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeTag(tag)}
                  aria-label={`Retirer le tag ${tag}`}
                  className="rounded-full p-0.5 text-paper-muted transition-colors hover:text-paper-accent disabled:opacity-50"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Tag>
            ))
          )}
        </div>

        <form onSubmit={addTag} className="flex items-center gap-2">
          <input
            type="text"
            value={tagInput}
            disabled={disabled || song.tags.length >= MAX_TAGS_PER_SONG}
            onChange={(event) => setTagInput(event.target.value)}
            placeholder={
              song.tags.length >= MAX_TAGS_PER_SONG ? 'Limite atteinte' : 'Ajouter un tag…'
            }
            maxLength={50}
            aria-label="Ajouter un tag"
            className="w-full rounded-paper border border-paper-border bg-paper-surface px-2.5 py-1.5 text-xs text-paper-text placeholder:text-paper-muted/70 focus:border-paper-accent focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || tagInput.trim().length === 0}
            aria-label="Ajouter le tag"
            className="rounded-paper border border-paper-border bg-paper-surface p-1.5 text-paper-muted transition-colors hover:text-paper-accent disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </form>
      </section>
    </aside>
  );
}
