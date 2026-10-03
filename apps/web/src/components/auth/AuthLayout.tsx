import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { ThemeSwitch } from '../common/ThemeSwitch.js';
import { Logo } from '../common/Logo.js';
import { OAuthButtons } from './OAuthButtons.js';

interface AuthQuote {
  lines: string[];
  author: string;
  detail?: string;
}

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  quote: AuthQuote;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showSocial?: boolean;
}

export function AuthLayout({
  title,
  subtitle,
  quote,
  children,
  footer,
  showSocial = false,
}: AuthLayoutProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-paper-bg text-paper-text flex flex-col justify-between selection:bg-paper-accent/20 selection:text-paper-accent">
      {/* Barre supérieure minimale */}
      <header className="px-6 py-4 border-b border-paper-border flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-paper-muted hover:text-paper-accent transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour à l'atelier</span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeSwitch />
        </div>
      </header>

      {/* Corps en deux colonnes sur desktop, une seule sur mobile */}
      <main className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 items-stretch py-8 sm:py-12 px-6 md:px-12 gap-8 lg:gap-12">
        {/* Colonne gauche : Formulaire actif */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-6 flex flex-col justify-center max-w-md mx-auto w-full space-y-6"
        >
          <div className="space-y-2">
            <Link
              to="/"
              aria-label="Verso — retour à l'accueil"
              className="inline-flex text-paper-text transition-colors group-hover:text-paper-accent"
            >
              <Logo size="lg" title="Verso" />
            </Link>
            <h1 className="text-3xl font-serif text-paper-text tracking-tight font-normal">
              {title}
            </h1>
            <p className="text-sm text-paper-muted leading-relaxed font-sans">{subtitle}</p>
          </div>

          {/* Formulaire injecté */}
          <div className="rounded-xl border border-paper-border bg-paper-surface p-6 sm:p-8 shadow-paper-md paper-grain space-y-5">
            {children}

            {/* Séparateur et authentification tierce (Google & ORCID) */}
            {showSocial && (
              <div className="space-y-4 pt-4 border-t border-paper-border/60">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-paper-border/60" />
                  </div>
                  <span className="relative px-3 bg-paper-surface text-xs font-mono uppercase tracking-widest text-paper-muted">
                    ou
                  </span>
                </div>

                <OAuthButtons />
              </div>
            )}

            {/* Pied du cadre : Lien de bascule connexion/inscription */}
            {footer && (
              <div className="pt-2 text-center text-xs text-paper-muted font-sans border-t border-paper-border/60">
                {footer}
              </div>
            )}
          </div>
        </motion.div>

        {/* Colonne droite : Panneau éditorial (feuille de cahier artistique) */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="hidden lg:flex lg:col-span-6 flex-col justify-center items-center p-8"
        >
          <div className="w-full max-w-lg rounded-xl border border-paper-border bg-paper-surface p-8 sm:p-12 shadow-paper-lg paper-grain relative overflow-hidden notebook-margin pl-10">
            {/* Numérotation de cahier en haut */}
            <div className="flex items-center justify-between pb-6 mb-8 border-b border-paper-border/70 text-xs font-mono text-paper-muted">
              <span>Feuillet de session N° 84</span>
              <span className="text-paper-accent font-medium">Verso Écritures</span>
            </div>

            {/* Citation poétique originale */}
            <blockquote className="space-y-4 font-serif text-2xl sm:text-3xl leading-relaxed text-paper-text tracking-tight">
              {quote.lines.map((line, idx) => (
                <p key={idx} className={idx === 1 ? 'italic pl-3 text-paper-accent' : ''}>
                  « {line} »
                </p>
              ))}
            </blockquote>

            {/* Signature & Note de marge */}
            <div className="mt-8 pt-6 border-t border-paper-border/60 flex items-center justify-between text-xs font-mono text-paper-muted">
              <div>
                <span className="font-semibold text-paper-text block">{quote.author}</span>
                {quote.detail && <span>{quote.detail}</span>}
              </div>
              <span className="w-8 h-8 rounded-full border border-paper-accent/40 bg-paper-accent/10 flex items-center justify-center text-paper-accent font-serif text-xs">
                V.
              </span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Bas de page minimal */}
      <footer className="px-6 py-4 border-t border-paper-border text-center text-xs font-mono text-paper-muted">
        <span>Verso • Atelier d'écriture pour auteurs de rap • Données chiffrées & privées</span>
      </footer>
    </div>
  );
}
