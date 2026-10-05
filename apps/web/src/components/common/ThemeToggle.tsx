import React from 'react';
import { Sun, Moon, type LucideIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';
import { Button } from '../ui/Button.js';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

interface ThemeOption {
  value: 'light' | 'dark';
  label: string;
  hint: string;
  Icon: LucideIcon;
}

const OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Papier', hint: 'Activer le mode clair (Papier)', Icon: Sun },
  { value: 'dark', label: 'Encre', hint: 'Activer le mode sombre (Encre)', Icon: Moon },
];

/**
 * Bascule de thème segmentée « Papier / Encre ».
 * Respecte les préférences système, persiste le choix et reste utilisable au clavier
 * et au lecteur d'écran (boutons à bascule `aria-pressed`). Réutilise le composant
 * `Button` unique pour garantir une icône de taille fixe et un alignement constant.
 */
export function ThemeToggle({
  className = '',
  showLabel = false,
}: ThemeToggleProps): React.ReactElement {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Thème de l'interface"
      className={`inline-flex items-center gap-0.5 rounded-full border border-paper-border bg-paper-surface/70 p-0.5 backdrop-blur-sm ${className}`}
    >
      {OPTIONS.map(({ value, label, hint, Icon }) => {
        const isActive = theme === value;
        return (
          <Button
            key={value}
            type="button"
            variant="ghost"
            size="sm"
            iconOnly={!showLabel}
            aria-pressed={isActive}
            aria-label={hint}
            title={hint}
            onClick={() => setTheme(value)}
            icon={<Icon className="w-5 h-5" aria-hidden="true" />}
            className={`!rounded-full ${
              isActive
                ? '!bg-paper-bg !text-paper-text shadow-paper-sm'
                : 'text-paper-muted hover:text-paper-text'
            }`}
          >
            {showLabel ? <span className="text-[11px] tracking-wide">{label}</span> : undefined}
          </Button>
        );
      })}
    </div>
  );
}
