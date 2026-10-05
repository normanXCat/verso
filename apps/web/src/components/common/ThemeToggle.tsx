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
 *
 * Couleurs **plates** issues des jetons du thème (aucun dégradé, aucune transparence
 * ni ombre) et hauteur alignée sur les autres éléments de la barre : le groupe mesure
 * 36 px (`h-9`) comme les boutons `sm`, ses segments internes 32 px.
 * Reste utilisable au clavier et au lecteur d'écran (`role="group"`, `aria-pressed`).
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
      className={`inline-flex h-9 shrink-0 items-center gap-0.5 rounded-paper border border-paper-border bg-paper-surface p-0.5 ${className}`}
    >
      {OPTIONS.map(({ value, label, hint, Icon }) => {
        const isActive = theme === value;
        return (
          <Button
            key={value}
            type="button"
            variant="ghost"
            size="icon"
            iconOnly={!showLabel}
            aria-pressed={isActive}
            aria-label={hint}
            title={hint}
            onClick={() => setTheme(value)}
            iconLeft={<Icon className="h-4 w-4" aria-hidden="true" />}
            className={`!h-8 !rounded-paper ${
              showLabel ? '!w-auto !gap-1.5 !px-2' : '!w-8'
            } ${isActive ? '!bg-paper-bg !text-paper-text' : 'text-paper-muted hover:text-paper-text'}`}
          >
            {showLabel ? <span className="text-[11px] tracking-wide">{label}</span> : undefined}
          </Button>
        );
      })}
    </div>
  );
}
