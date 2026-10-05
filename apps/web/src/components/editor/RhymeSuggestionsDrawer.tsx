import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X } from 'lucide-react';
import { findRhymes, type RhymeSuggestion } from '@verso/shared';

interface RhymeSuggestionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Mot sélectionné dans l'éditeur (vide si aucune sélection). */
  word: string;
  /** Insère la rime choisie à la place de la sélection. */
  onSelect: (word: string) => void;
}

const WORD_SELECTION_PATTERN = /^[\p{L}][\p{L}'’-]*$/u;

/**
 * Tiroir latéral de suggestions de rimes françaises (FR-049) : rimes riches et
 * suffisantes proposées pour le mot sélectionné, avec insertion en un clic.
 */
export function RhymeSuggestionsDrawer({
  isOpen,
  onClose,
  word,
  onSelect,
}: RhymeSuggestionsDrawerProps): React.ReactElement {
  const suggestions = useMemo<RhymeSuggestion[]>(() => {
    const trimmed = word.trim();
    if (!WORD_SELECTION_PATTERN.test(trimmed)) {
      return [];
    }
    return findRhymes(trimmed);
  }, [word]);

  const rich = suggestions.filter((suggestion) => suggestion.richness === 'rich');
  const sufficient = suggestions.filter((suggestion) => suggestion.richness === 'sufficient');
  const hasWord = WORD_SELECTION_PATTERN.test(word.trim());

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Suggestions de rimes"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-paper-border bg-paper-surface text-paper-text shadow-paper-lg"
          >
            <header className="flex items-center justify-between gap-3 border-b border-paper-border px-5 py-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-paper-accent" aria-hidden="true" />
                <h2 className="font-serif text-xl">Rimes</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer les suggestions de rimes"
                className="rounded p-1.5 text-paper-muted transition-colors hover:text-paper-text"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {!hasWord ? (
                <p className="text-sm text-paper-muted">
                  Sélectionnez un mot dans le texte pour voir les rimes riches et suffisantes
                  proposées.
                </p>
              ) : (
                <>
                  <p className="mb-4 text-xs text-paper-muted">
                    Rimes pour{' '}
                    <span className="font-serif text-base text-paper-text">« {word.trim()} »</span>
                  </p>

                  {suggestions.length === 0 ? (
                    <p className="text-sm text-paper-muted">
                      Aucune suggestion dans le dictionnaire embarqué pour cette terminaison.
                    </p>
                  ) : (
                    <div className="space-y-5">
                      <RhymeGroup title="Rimes riches" items={rich} onSelect={onSelect} />
                      <RhymeGroup
                        title="Rimes suffisantes"
                        items={sufficient}
                        onSelect={onSelect}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

interface RhymeGroupProps {
  title: string;
  items: RhymeSuggestion[];
  onSelect: (word: string) => void;
}

function RhymeGroup({ title, items, onSelect }: RhymeGroupProps): React.ReactElement | null {
  if (items.length === 0) {
    return null;
  }
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-mono uppercase tracking-[0.2em] text-paper-muted">
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <button
            key={item.word}
            type="button"
            onClick={() => onSelect(item.word)}
            className="rounded-paper border border-paper-border bg-paper-bg px-2.5 py-1 text-sm text-paper-text transition-colors hover:border-paper-accent hover:text-paper-accent"
          >
            {item.word}
          </button>
        ))}
      </div>
    </section>
  );
}

export default RhymeSuggestionsDrawer;
