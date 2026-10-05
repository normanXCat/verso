import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button.js';
import type { PresentedAuthError } from '../../lib/auth-errors.js';

interface FormErrorProps {
  error: PresentedAuthError | null;
  onRetry?: () => void;
}

/**
 * Zone d'erreur de formulaire annoncée aux lecteurs d'écran (`role="alert"`).
 * La hauteur est animée pour éviter tout saut brutal de la mise en page et un
 * bouton « Réessayer » apparaît lorsque l'erreur est temporaire.
 */
export function FormError({ error, onRetry }: FormErrorProps): React.ReactElement {
  return (
    <div aria-live="assertive">
      <AnimatePresence initial={false}>
        {error && (
          <motion.div
            key="form-error"
            role="alert"
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-paper-accent/40 bg-paper-accent/10 text-paper-accent">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-2 min-w-0">
                <p className="text-xs font-sans font-medium leading-relaxed">{error.message}</p>

                {error.details.length > 0 && (
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] font-mono">
                    {error.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                )}

                {error.retryable && onRetry && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onRetry}
                    className="mt-0.5"
                  >
                    Réessayer
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
