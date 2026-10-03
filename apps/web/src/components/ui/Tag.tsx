import React from 'react';

export type TagVariant = 'neutral' | 'accent' | 'success' | 'draft';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  mono?: boolean;
  children: React.ReactNode;
}

export function Tag({
  variant = 'neutral',
  mono = false,
  className = '',
  children,
  ...props
}: TagProps): React.ReactElement {
  const variants: Record<TagVariant, string> = {
    neutral: 'border-paper-border text-paper-muted bg-paper-surface',
    accent: 'border-paper-accent/40 text-paper-accent bg-paper-accent/5',
    success: 'border-emerald-700/40 text-emerald-600 dark:text-emerald-400 bg-emerald-950/10',
    draft: 'border-amber-700/40 text-amber-600 dark:text-amber-400 bg-amber-950/10',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-medium tracking-tight select-none ${
        mono ? 'font-mono' : 'font-sans'
      } ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
