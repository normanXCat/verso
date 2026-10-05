import React from 'react';

export interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  /** Section actuellement visible : affiche l'état actif (couleur + trait). */
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Lien de navigation du design system « Encre & Papier ».
 *
 * Le style est centralisé ici : c'est la pièce qui manquait au design system (les liens
 * de la barre étaient stylés au cas par cas). Propriétés garanties :
 * - aucun soulignement natif (`no-underline`) — le trait est un élément décoratif animé ;
 * - couleur de texte secondaire au repos, texte principal au survol ;
 * - trait fin vermillon dessiné au survol en 150 ms via `transform` (aucun reflow) ;
 * - état actif visible en permanence (`aria-current="true"`) ;
 * - focus visible assuré par l'anneau global `:focus-visible` de `index.css`.
 */
export function NavLink({
  href,
  children,
  isActive = false,
  onClick,
  className = '',
}: NavLinkProps): React.ReactElement {
  return (
    <a
      href={href}
      onClick={onClick}
      aria-current={isActive ? 'true' : undefined}
      className={`group/nav relative inline-flex h-9 items-center text-sm font-medium no-underline transition-colors duration-150 ${
        isActive ? 'text-paper-text' : 'text-paper-muted hover:text-paper-text'
      } ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        data-nav-underline
        className={`pointer-events-none absolute inset-x-0 bottom-1 h-px origin-left bg-paper-accent transition-transform duration-150 ease-out motion-reduce:transition-none ${
          isActive ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100'
        }`}
      />
    </a>
  );
}
