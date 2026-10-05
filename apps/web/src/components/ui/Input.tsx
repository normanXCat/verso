import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from './Button.js';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  isValid?: boolean;
  hint?: string;
  showPasswordStrength?: boolean;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      isValid,
      hint,
      showPasswordStrength = false,
      type = 'text',
      className = '',
      containerClassName = '',
      value,
      onChange,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const hasValue = value !== undefined && value !== null && String(value).length > 0;
    const isFloating = isFocused || hasValue;

    // Calcul de force du mot de passe (4 segments)
    const calculateStrength = (pass: string): number => {
      let score = 0;
      if (pass.length >= 8) score++;
      if (/[A-Z]/.test(pass)) score++;
      if (/[0-9]/.test(pass)) score++;
      if (/[^A-Za-z0-9]/.test(pass)) score++;
      return score;
    };

    const passwordStrength = isPassword && value ? calculateStrength(String(value)) : 0;

    return (
      <div className={`w-full space-y-1.5 ${containerClassName}`}>
        <div className="relative pt-3">
          {label && (
            <motion.label
              initial={false}
              animate={{
                y: isFloating ? -20 : 6,
                scale: isFloating ? 0.85 : 1,
                color: error
                  ? 'var(--color-accent)'
                  : isFocused
                    ? 'var(--color-accent)'
                    : 'var(--color-text-secondary)',
              }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 top-3 origin-left pointer-events-none text-sm font-sans tracking-wide select-none"
            >
              {label}
            </motion.label>
          )}

          <div className="relative flex items-center">
            <input
              ref={ref}
              type={computedType}
              value={value}
              onChange={onChange}
              onFocus={(e) => {
                setIsFocused(true);
                onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                onBlur?.(e);
              }}
              className={`w-full bg-transparent py-2.5 text-sm text-paper-text placeholder-transparent focus:outline-none font-sans ${
                isPassword ? 'pr-16' : isValid !== undefined ? 'pr-8' : ''
              } ${className}`}
              {...props}
            />

            {/* Icône de validation interactive */}
            <div className="absolute right-0 flex items-center gap-1.5">
              {isPassword && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  iconOnly
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="text-paper-muted hover:text-paper-text"
                  icon={
                    showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )
                  }
                />
              )}

              {isValid !== undefined && (
                <span className="p-1">
                  {isValid ? (
                    <motion.span
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-emerald-500 inline-block"
                    >
                      <Check className="w-4 h-4" aria-hidden="true" />
                    </motion.span>
                  ) : error ? (
                    <motion.span
                      initial={{ scale: 0, rotate: 45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-paper-accent inline-block"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </motion.span>
                  ) : null}
                </span>
              )}
            </div>
          </div>

          {/* Ligne de base grise subtile */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-paper-border" />

          {/* Ligne d'accent animée qui se dessine au focus */}
          <motion.div
            initial={false}
            animate={{
              scaleX: isFocused ? 1 : 0,
              backgroundColor: error ? 'var(--color-accent)' : 'var(--color-accent)',
            }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 left-0 right-0 h-[2px] origin-left"
          />
        </div>

        {/* Jauge de force segmentée pour mot de passe */}
        {showPasswordStrength && isPassword && hasValue && (
          <div className="pt-1 space-y-1">
            <div className="grid grid-cols-4 gap-1.5 h-1">
              {[1, 2, 3, 4].map((step) => {
                const isActive = passwordStrength >= step;
                return (
                  <div
                    key={step}
                    className={`h-full rounded-full transition-colors duration-300 ${
                      isActive
                        ? passwordStrength <= 2
                          ? 'bg-amber-600'
                          : 'bg-paper-accent'
                        : 'bg-paper-border/60'
                    }`}
                  />
                );
              })}
            </div>
            <p className="text-[11px] font-mono text-paper-muted">
              {passwordStrength <= 1 && 'Très faible'}
              {passwordStrength === 2 && 'Moyen (ajoutez chiffres/symboles)'}
              {passwordStrength === 3 && 'Fort'}
              {passwordStrength === 4 && 'Excellent mot de passe'}
            </p>
          </div>
        )}

        {/* Indication / Message d'erreur avec glissement doux */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-xs text-paper-accent font-sans"
            >
              {error}
            </motion.p>
          ) : hint ? (
            <p className="text-[11px] text-paper-muted font-sans">{hint}</p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  },
);

Input.displayName = 'Input';
