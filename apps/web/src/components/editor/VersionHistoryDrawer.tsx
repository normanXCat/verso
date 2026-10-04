import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { History, RotateCcw, X } from 'lucide-react';
import type { SongDetail, SongVersionItem } from '@verso/shared';
import { songsClient } from '../../lib/songs-client.js';
import { useToast } from '../ui/Toast.js';

interface VersionHistoryDrawerProps {
  songId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Applique la version restaurée au contenu local de l'éditeur. */
  onRestored: (song: SongDetail) => void;
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return dateFormatter.format(date);
}

function buildExcerpt(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 160) {
    return normalized;
  }
  return `${normalized.slice(0, 160).trimEnd()}…`;
}

/**
 * Tiroir latéral d'historique des versions : liste horodatée immuable,
 * aperçu comparatif et restauration sans écrasement de l'historique.
 */
export function VersionHistoryDrawer({
  songId,
  isOpen,
  onClose,
  onRestored,
}: VersionHistoryDrawerProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<SongVersionItem | null>(null);

  const {
    data: versions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['songs', 'versions', songId],
    queryFn: () => songsClient.versions(songId),
    enabled: isOpen && songId.length > 0,
  });

  const restoreMutation = useMutation({
    mutationFn: (versionId: string) => songsClient.restoreVersion(songId, versionId),
    onSuccess: (restored) => {
      onRestored(restored);
      setSelected(null);
      void queryClient.invalidateQueries({ queryKey: ['songs', 'versions', songId] });
      void queryClient.invalidateQueries({ queryKey: ['songs', 'search'] });
      toast('Version restaurée. L’historique précédent est conservé.', 'success');
    },
    onError: () => toast('Impossible de restaurer cette version.', 'error'),
  });

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
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Historique des versions"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-paper-border bg-paper-surface text-paper-text shadow-paper-lg"
          >
            <header className="flex items-center justify-between gap-3 border-b border-paper-border px-5 py-4">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-paper-accent" aria-hidden="true" />
                <h2 className="font-serif text-xl">Historique</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer l'historique"
                className="rounded p-1.5 text-paper-muted transition-colors hover:text-paper-text"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <p className="border-b border-paper-border/60 px-5 py-3 text-xs leading-relaxed text-paper-muted">
              Chaque révision est horodatée et conservée indéfiniment. Restaurer une version archive
              l'état courant avant de l'appliquer : rien n'est jamais perdu.
            </p>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {isLoading ? (
                <div className="space-y-2" aria-busy="true">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="h-16 animate-pulse rounded-card bg-paper-bg" />
                  ))}
                </div>
              ) : isError ? (
                <p className="text-sm text-paper-accent">
                  Impossible de charger l'historique pour le moment.
                </p>
              ) : !versions || versions.length === 0 ? (
                <p className="text-sm text-paper-muted">
                  Aucune version enregistrée pour l'instant. Vos prochaines modifications
                  apparaîtront ici.
                </p>
              ) : (
                <ul className="space-y-2">
                  {versions.map((version) => {
                    const isSelected = selected?.id === version.id;
                    return (
                      <li key={version.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(isSelected ? null : version)}
                          aria-expanded={isSelected}
                          className={`w-full rounded-card border px-3 py-2.5 text-left transition-colors ${
                            isSelected
                              ? 'border-paper-accent bg-paper-accent/5'
                              : 'border-paper-border bg-paper-bg hover:border-paper-muted'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-serif text-base text-paper-text">
                              {version.title}
                            </span>
                            <span className="shrink-0 text-[11px] font-mono text-paper-muted">
                              {formatDate(version.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-paper-muted">
                            {buildExcerpt(version.content) || 'Version vide'}
                          </p>
                        </button>

                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 overflow-hidden rounded-card border border-paper-border bg-paper-surface"
                          >
                            <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap px-3 py-2.5 font-sans text-xs leading-relaxed text-paper-text">
                              {version.content || '—'}
                            </pre>
                            <div className="flex justify-end border-t border-paper-border/60 p-2">
                              <button
                                type="button"
                                onClick={() => restoreMutation.mutate(version.id)}
                                disabled={restoreMutation.isPending}
                                className="inline-flex items-center gap-1.5 rounded-paper border border-paper-accent bg-paper-accent/5 px-3 py-1.5 text-xs font-medium text-paper-accent transition-colors hover:bg-paper-accent/10 disabled:opacity-50"
                              >
                                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                                {restoreMutation.isPending ? 'Restauration…' : 'Restaurer'}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
