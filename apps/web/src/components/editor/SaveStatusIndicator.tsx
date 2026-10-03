import React from 'react';
import { AlertCircle, Check, CloudOff, Loader2 } from 'lucide-react';
import type { SaveStatus } from '../../hooks/useAutoSave.js';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  className?: string;
}

const STATUS_STYLES: Record<SaveStatus, string> = {
  idle: 'text-paper-muted',
  saving: 'text-paper-muted',
  saved: 'text-emerald-600 dark:text-emerald-400',
  offline: 'text-amber-600 dark:text-amber-400',
  error: 'text-paper-accent',
};

const STATUS_LABELS: Record<SaveStatus, string> = {
  idle: 'Prêt',
  saving: 'Enregistrement…',
  saved: 'Enregistré',
  offline: 'Hors ligne — sera synchronisé',
  error: "Échec de l'enregistrement",
};

/**
 * Indicateur discret du statut de sauvegarde automatique.
 */
export function SaveStatusIndicator({
  status,
  className = '',
}: SaveStatusIndicatorProps): React.ReactElement {
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
      <span>{STATUS_LABELS[status]}</span>
    </span>
  );
}
