import React from 'react';
import type { SongFilter } from '@verso/shared';

const FILTERS: { value: SongFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'drafts', label: 'Brouillons' },
  { value: 'completed', label: 'Terminés' },
  { value: 'favorites', label: 'Favoris' },
];

interface FilterBarProps {
  value: SongFilter;
  onChange: (value: SongFilter) => void;
}

/**
 * Filtres combinables de l'espace personnel (FR-013) : tous, brouillons,
 * textes terminés et favoris.
 */
export function FilterBar({ value, onChange }: FilterBarProps): React.ReactElement {
  return (
    <div
      role="tablist"
      aria-label="Filtrer les textes"
      className="flex flex-wrap items-center gap-2"
    >
      {FILTERS.map((filter) => {
        const isActive = filter.value === value;
        return (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(filter.value)}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-mono tracking-wide transition-colors duration-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper-bg ${
              isActive
                ? 'border-paper-accent bg-paper-accent/5 text-paper-accent'
                : 'border-paper-border bg-paper-surface text-paper-muted hover:border-paper-muted hover:text-paper-text'
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
