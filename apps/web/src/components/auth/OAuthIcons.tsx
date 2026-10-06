import React from 'react';

/**
 * Logo « G » officiel de Google (quatre couleurs de marque).
 * Lisible en thème clair comme en thème sombre (fond blanc/bleu/jaune/rouge).
 */
export function GoogleIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/**
 * Logo « iD » officiel d'ORCID (disque vert #A6CE39, monogramme blanc).
 * Construit en formes vectorielles pour rester net à petite taille et lisible
 * sur les deux thèmes.
 */
export function OrcidIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 256 256" role="img" aria-hidden="true" focusable="false">
      <circle cx="128" cy="128" r="128" fill="#A6CE39" />
      <g fill="#ffffff">
        {/* Point du « i » */}
        <rect x="74" y="54" width="30" height="30" rx="6" />
        {/* Hampe du « i » */}
        <rect x="74" y="102" width="30" height="100" rx="6" />
        {/* Hampe du « D » */}
        <rect x="136" y="54" width="30" height="148" rx="6" />
        {/* Boucle du « D » */}
        <path d="M166 54 h22 a74 74 0 0 1 0 148 h-22 v-30 h22 a44 44 0 0 0 0 -88 h-22 z" />
      </g>
    </svg>
  );
}
