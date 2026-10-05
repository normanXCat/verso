import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  isSuccess?: boolean;
  successText?: string;
  shake?: boolean;
  /** Icône affichée dans un emplacement de taille fixe (20 px). */
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  /** Bouton icône seule : masque le texte et exige un `aria-label`. */
  iconOnly?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      isSuccess = false,
      successText,
      shake = false,
      icon,
      iconPosition = 'left',
      iconOnly = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'relative inline-flex items-center justify-center font-medium tracking-tight rounded-paper transition-colors duration-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper-bg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

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

    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3.5 text-base',
      icon: 'p-2 text-sm',
    };

    const effectiveSize: ButtonSize = iconOnly && size !== 'icon' ? 'icon' : size;
    const label =
      isSuccess && successText ? successText : isLoading && loadingText ? loadingText : children;

    const showIconSlot = icon !== undefined || isLoading || isSuccess;
    const iconSlotContent = isSuccess ? (
      <Check className="w-5 h-5" aria-hidden="true" />
    ) : isLoading ? (
      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
    ) : (
      <span className="inline-flex items-center justify-center w-5 h-5 [&>svg]:w-5 [&>svg]:h-5 [&>svg]:shrink-0">
        {icon}
      </span>
    );

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        animate={shake ? { x: [-6, 6, -4, 4, -2, 2, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        disabled={disabled || isLoading || isSuccess}
        className={`${baseStyles} ${variants[variant]} ${sizes[effectiveSize]} ${
          iconOnly ? '' : 'gap-2'
        } ${isSuccess ? 'bg-emerald-600 border-emerald-500 text-white' : ''} ${className}`}
        {...props}
      >
        {showIconSlot && iconPosition === 'left' && (
          <span className="inline-flex items-center justify-center w-5 h-5 shrink-0">
            {iconSlotContent}
          </span>
        )}

        {!iconOnly && label !== undefined && label !== null && label !== '' && (
          <span className="whitespace-nowrap">{label}</span>
        )}

        {showIconSlot && iconPosition === 'right' && (
          <span className="inline-flex items-center justify-center w-5 h-5 shrink-0">
            {iconSlotContent}
          </span>
        )}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
