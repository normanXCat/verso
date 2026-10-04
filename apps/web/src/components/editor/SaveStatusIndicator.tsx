import React from 'react';
import { AlertCircle, Check, CloudOff, GitMerge, Loader2 } from 'lucide-react';
import type { SaveStatus } from '../../hooks/useOfflineSync.js';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  /** Nombre d'actions en attente de synchronisation hors ligne. */
  pendingCount?: number;
  className?: string;
}

const STATUS_STYLES: Record<SaveStatus, string> = {
  idle: 'text-paper-muted',
  saving: 'text-paper-muted',
  saved: 'text-emerald-600 dark:text-emerald-400',
  offline: 'text-amber-600 dark:text-amber-400',
  error: 'text-paper-accent',
  conflict: 'text-amber-600 dark:text-amber-400',
};

const STATUS_LABELS: Record<SaveStatus, string> = {
  idle: 'Prêt',
  saving: 'Enregistrement…',
  saved: 'Enregistré',
  offline: 'Hors ligne — sera synchronisé',
  error: "Échec de l'enregistrement",
  conflict: 'Conflit : copie créée',
};

/**
 * Indicateur discret du statut de sauvegarde automatique et de synchronisation.
 */
export function SaveStatusIndicator({
  status,
  pendingCount = 0,
  className = '',
}: SaveStatusIndicatorProps): React.ReactElement {
  const showPending = pendingCount > 0 && status !== 'saving';

  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 text-[11px] font-mono ${STATUS_STYLES[status]} ${className}`}
    >
      {status === 'saving' && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
      {status === 'saved' && <Check className="h-3 w-3" aria-hidden="true" />}
      {status === 'offline' && <CloudOff className="h-3 w-3" aria-hidden="true" />}
      {status === 'error' && <AlertCircle className="h-3 w-3" aria-hidden="true" />}
      {status === 'conflict' && <GitMerge className="h-3 w-3" aria-hidden="true" />}
      <span>{STATUS_LABELS[status]}</span>
      {showPending && <span className="text-paper-muted">· {pendingCount} en attente</span>}
    </span>
  );
}
