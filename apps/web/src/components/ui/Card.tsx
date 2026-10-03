import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<'div'> {
  ruled?: boolean;
  margin?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { ruled = false, margin = false, interactive = false, className = '', children, ...props },
    ref,
  ) => {
    return (
      <motion.div
        ref={ref}
        whileHover={
          interactive
            ? {
                y: -3,
                rotateZ: 0.5,
                transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
              }
            : undefined
        }
        className={`relative rounded-card border border-paper-border bg-paper-surface p-6 shadow-paper-sm transition-shadow duration-paper ${
          interactive ? 'hover:shadow-paper-md hover:border-paper-muted cursor-pointer' : ''
        } ${ruled ? 'notebook-ruled' : ''} ${margin ? 'notebook-margin pl-6' : ''} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

Card.displayName = 'Card';
