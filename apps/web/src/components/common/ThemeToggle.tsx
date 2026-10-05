import React from 'react';
import { Sun, Moon, type LucideIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';

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
 * et au lecteur d'écran (boutons à bascule `aria-pressed`).
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
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={isActive}
            title={hint}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono tracking-wide transition-all duration-paper ease-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper-accent focus-visible:ring-offset-1 focus-visible:ring-offset-paper-bg ${
              isActive
                ? 'bg-paper-bg text-paper-text shadow-paper-sm'
                : 'text-paper-muted hover:text-paper-text'
            }`}
          >
            <Icon
              className={`h-3.5 w-3.5 transition-transform duration-paper ease-paper ${
                isActive ? 'scale-100' : 'scale-90'
              } ${isActive && value === 'dark' ? 'rotate-[-12deg]' : ''}`}
              aria-hidden
            />
            {showLabel && <span className="text-[11px]">{label}</span>}
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
