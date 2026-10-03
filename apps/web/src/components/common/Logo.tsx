import React from 'react';

export type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  /** Libellé accessible ; le logotype est décoratif par défaut. */
  title?: string;
  className?: string;
}

const SIZE_CLASSES: Record<LogoSize, string> = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-10',
};

/**
 * Logotype « Verso » (V signature + lettrage Instrument Serif + point vermillon).
 * Hérite de la couleur du texte (`currentColor`) pour s'adapter au thème clair/sombre ;
 * le point de ponctuation reste toujours vermillon.
 */
export function Logo({ size = 'md', title, className = '' }: LogoProps): React.ReactElement {
  return (
    <svg
      viewBox="0 0 260 64"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={`w-auto ${SIZE_CLASSES[size]} ${className}`}
    >
      <path d="M12 14H26L33 40L47 14H52L35 50H30Z" fill="currentColor" />
      <text
        x="62"
        y="50"
        fontFamily="'Instrument Serif', 'Fraunces', Georgia, serif"
        fontSize="58"
        letterSpacing="-1"
        fill="currentColor"
      >
        erso
      </text>
      <circle cx="243" cy="46" r="4" fill="var(--color-accent)" />
    </svg>
  );
}
