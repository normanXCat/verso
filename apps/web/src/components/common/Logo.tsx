import React from 'react';
import wordmarkSvg from '../../../public/logo-wordmark.svg?raw';

export type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  /** Libellé accessible ; le logotype est décoratif par défaut. */
  title?: string;
  className?: string;
}

/** Hauteur du wordmark ; la largeur suit le rapport du viewBox (1989 / 730). */
const SIZE_CLASSES: Record<LogoSize, string> = {
  sm: 'h-5',
  md: 'h-6',
  lg: 'h-7',
};

/**
 * `logo-wordmark.svg` est la **source unique** du logotype : le V signature, le lettrage
 * « erso » (Instrument Serif converti en tracés, donc aucune dépendance à une fonte) et le
 * point vermillon y sont positionnés au dixième d'unité de police près.
 *
 * Le fichier est intégré **en ligne** plutôt qu'en `<img>` pour qu'il suive le thème :
 * - l'encre (`#14110F`) devient `currentColor` → elle hérite de `text-paper-text` et du
 *   survol de la barre de navigation ;
 * - le point (`#D9421C`) devient `var(--color-accent)` → le jeton vermillon du thème
 *   (plus clair en mode Encre) ;
 * - le `<title>` est retiré : le nom accessible est porté par le conteneur (pas de
 *   double annonce aux lecteurs d'écran).
 */
const WORDMARK_MARKUP = wordmarkSvg
  .replace(/#14110F/gi, 'currentColor')
  .replace(/#D9421C/gi, 'var(--color-accent)')
  .replace(/<title>[\s\S]*?<\/title>\s*/g, '');

export function Logo({ size = 'md', title, className = '' }: LogoProps): React.ReactElement {
  return (
    <span
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={`inline-flex items-center leading-none text-paper-text ${SIZE_CLASSES[size]} ${className} [&>svg]:block [&>svg]:h-full [&>svg]:w-auto`}
      dangerouslySetInnerHTML={{ __html: WORDMARK_MARKUP }}
    />
  );
}
