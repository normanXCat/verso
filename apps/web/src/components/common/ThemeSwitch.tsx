import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';

interface ThemeSwitchProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeSwitch({
  className = '',
  showLabel = false,
}: ThemeSwitchProps): React.ReactElement {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Basculer en mode ${isDark ? 'clair (Papier)' : 'sombre (Encre)'}`}
      title={`Passer en mode ${isDark ? 'clair' : 'sombre'}`}
      className={`group relative inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-paper-border bg-paper-surface hover:border-paper-muted text-paper-muted hover:text-paper-text transition-colors duration-paper text-xs font-mono ${className}`}
    >
      <span className="relative flex items-center justify-center w-4 h-4">
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-paper-accent transition-transform duration-paper group-hover:rotate-12" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-paper-accent transition-transform duration-paper group-hover:rotate-45" />
        )}
      </span>
      {showLabel && (
        <span className="text-[11px] tracking-wide">{isDark ? 'Encre' : 'Papier'}</span>
      )}
    </button>
  );
}
