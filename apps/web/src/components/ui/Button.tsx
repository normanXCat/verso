import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icône à gauche (emplacement fixe 20 px, `aria-hidden`). */
  iconLeft?: React.ReactNode;
  /** Icône à droite — la flèche des appels à l'action se décale au survol. */
  iconRight?: React.ReactNode;
  /** État de chargement : l'indicateur remplace l'icône sans changer la largeur. */
  loading?: boolean;
  /** Alias rétro-compatible de `loading`. */
  isLoading?: boolean;
  loadingText?: string;
  isSuccess?: boolean;
  successText?: string;
  shake?: boolean;
  /** Bouton icône seule : masque le label et exige un `aria-label`. */
  iconOnly?: boolean;
  /** Étend le bouton à la largeur de son conteneur (`w-full`). */
  fullWidth?: boolean;
  /**
   * Rend l'unique enfant (ex. un `<Link>` React Router) avec le style du bouton,
   * pour un rendu identique à celui d'un `<button>`.
   */
  asChild?: boolean;
  /** Rétro-compatibilité : icône unique positionnée par `iconPosition`. */
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

const ICON_SLOT =
  'inline-flex items-center justify-center w-5 h-5 shrink-0 [&>svg]:block [&>svg]:w-5 [&>svg]:h-5';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      iconLeft,
      iconRight,
      loading = false,
      isLoading: isLoadingProp = false,
      loadingText,
      isSuccess = false,
      successText,
      shake = false,
      iconOnly = false,
      fullWidth = false,
      asChild = false,
      icon,
      iconPosition = 'left',
      disabled,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const isLoading = loading || isLoadingProp;
    const isDisabled = Boolean(disabled) || isLoading || isSuccess;

    // `icon`/`iconPosition` restent supportés pour la rétro-compatibilité.
    const leadingIcon = iconLeft ?? (iconPosition === 'left' ? icon : undefined);
    const trailingIcon = iconRight ?? (iconPosition === 'right' ? icon : undefined);
    const hasLeading = leadingIcon !== undefined;
    const hasTrailing = trailingIcon !== undefined;

    const spinner = <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />;
    const check = <Check className="w-5 h-5" aria-hidden="true" />;

    const renderIcon = (node: React.ReactNode, isTrailing: boolean): React.ReactNode => (
      <span
        aria-hidden="true"
        className={`${ICON_SLOT} ${
          isTrailing
            ? 'transition-transform duration-150 ease-out group-hover/btn:translate-x-0.5 motion-reduce:transition-none'
            : ''
        }`}
      >
        {node}
      </span>
    );

    // L'indicateur (chargement / succès) occupe l'emplacement de l'icône existante ;
    // en l'absence d'icône, il prend l'emplacement de gauche. La largeur est ainsi
    // préservée pour tous les boutons dotés d'une icône.
    let leadingSlot: React.ReactNode = null;
    let trailingSlot: React.ReactNode = null;

    if (isLoading) {
      if (hasLeading || !hasTrailing) {
        leadingSlot = renderIcon(spinner, false);
      } else {
        trailingSlot = renderIcon(spinner, false);
      }
    } else if (isSuccess) {
      if (hasLeading || !hasTrailing) {
        leadingSlot = renderIcon(check, false);
      } else {
        trailingSlot = renderIcon(check, false);
      }
    } else {
      leadingSlot = hasLeading ? renderIcon(leadingIcon, false) : null;
      trailingSlot = hasTrailing ? renderIcon(trailingIcon, true) : null;
    }

    const label =
      isSuccess && successText ? successText : isLoading && loadingText ? loadingText : children;

    const renderContent = (labelNode: React.ReactNode): React.ReactNode => (
      <>
        {leadingSlot}
        {!iconOnly && labelNode !== undefined && labelNode !== null && labelNode !== '' && (
          <span className="whitespace-nowrap">{labelNode}</span>
        )}
        {trailingSlot}
      </>
    );

    const baseStyles =
      'group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium tracking-tight rounded-paper transition-colors duration-paper cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper-bg disabled:opacity-50 disabled:cursor-not-allowed';

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-paper-accent hover:bg-paper-accent-hover text-white shadow-paper-sm border border-transparent font-medium',
      secondary:
        'bg-paper-surface hover:bg-paper-bg text-paper-text border border-paper-border hover:border-paper-muted shadow-paper-sm',
      ghost:
        'bg-transparent hover:bg-paper-border/20 text-paper-muted hover:text-paper-text border border-transparent',
      danger:
        'bg-transparent hover:bg-rose-950/20 text-rose-500 hover:text-rose-400 border border-rose-900/40 hover:border-rose-700/60',
    };

    // Hauteurs fixes par taille ; padding horizontal identique avec ou sans icône.
    const sizes: Record<ButtonSize, string> = {
      sm: 'h-9 px-3 text-xs',
      md: 'h-11 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
      icon: 'h-9 w-9 p-0 text-sm',
    };

    const effectiveSize: ButtonSize = iconOnly && size !== 'icon' ? 'icon' : size;

    const classes = [
      baseStyles,
      variants[variant],
      sizes[effectiveSize],
      fullWidth ? 'w-full' : '',
      isSuccess ? 'bg-emerald-600 border-emerald-500 text-white' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    if (asChild && React.isValidElement(children)) {
      const child = React.Children.only(children) as React.ReactElement<
        React.HTMLAttributes<HTMLElement>
      >;
      return React.cloneElement(child, {
        className: `${classes} ${child.props.className ?? ''}`.trim(),
        'aria-disabled': isDisabled || undefined,
        children: renderContent(child.props.children),
      });
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        animate={shake ? { x: [-6, 6, -4, 4, -2, 2, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        disabled={isDisabled}
        className={classes}
        {...props}
      >
        {renderContent(label)}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
