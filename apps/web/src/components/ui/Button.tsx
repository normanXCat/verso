import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
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
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />}
        <span>{isLoading && loadingText ? loadingText : children}</span>
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
