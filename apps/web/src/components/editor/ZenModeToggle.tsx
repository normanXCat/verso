import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface ZenModeToggleProps {
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * Bouton de bascule du mode concentration : plein écran, masquant les éléments
 * d'interface parasites pour isoler l'auteur avec son texte (FR-033).
 */
export function ZenModeToggle({
  isActive,
  onToggle,
  className = '',
}: ZenModeToggleProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isActive}
      aria-label={isActive ? 'Quitter le mode concentration' : 'Activer le mode concentration'}
      title={isActive ? 'Quitter le mode concentration' : 'Mode concentration (plein écran)'}
      className={`rounded p-1.5 text-paper-muted transition-colors hover:text-paper-text ${className}`}
    >
      {isActive ? (
        <Minimize2 className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Maximize2 className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

export default ZenModeToggle;
