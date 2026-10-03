import React from 'react';
import { countLines, countWords } from '@verso/shared';

interface EditorMetricsBarProps {
  content: string;
  className?: string;
}

const numberFormatter = new Intl.NumberFormat('fr-FR');

/**
 * Compteurs en temps réel du nombre de mots et de lignes.
 */
export function EditorMetricsBar({
  content,
  className = '',
}: EditorMetricsBarProps): React.ReactElement {
  const words = countWords(content);
  const lines = countLines(content);

  return (
    <div
      className={`flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.15em] text-paper-muted ${className}`}
      aria-label={`${words} mots, ${lines} lignes`}
    >
      <span className="inline-flex items-baseline gap-1.5">
        <span className="text-sm tracking-normal text-paper-text normal-case">
          {numberFormatter.format(words)}
        </span>
        {words > 1 ? 'mots' : 'mot'}
      </span>
      <span aria-hidden="true" className="text-paper-border">
        ·
      </span>
      <span className="inline-flex items-baseline gap-1.5">
        <span className="text-sm tracking-normal text-paper-text normal-case">
          {numberFormatter.format(lines)}
        </span>
        {lines > 1 ? 'lignes' : 'ligne'}
      </span>
    </div>
  );
}
