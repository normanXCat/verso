import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, Shield, Zap } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { RapSheetSignature } from './RapSheetSignature.js';

export function HeroSection(): React.ReactElement {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
      {/* Fond photographique discret : cahier argentique aux pages vierges */}
      <div
        className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0"
        aria-hidden="true"
      >
        <picture>
          <source srcSet="/images/hero/hero-notebook.avif" type="image/avif" />
          <source srcSet="/images/hero/hero-notebook.webp" type="image/webp" />
          <img
            src="/images/hero/hero-notebook.jpg"
            alt=""
            width={1376}
            height={768}
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover object-center opacity-25 dark:opacity-15 grayscale contrast-125 dark:brightness-75 transition-opacity duration-300"
          />
        </picture>
        {/* Surface unie semi-opaque assurant le respect strict des contrastes WCAG AA */}
        <div className="absolute inset-0 bg-paper-bg/75 dark:bg-paper-bg/85" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        {/* Colonne Gauche : Titres & CTA éditoriaux */}
        <div className="lg:col-span-6 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-paper-border bg-paper-surface/60 text-xs font-mono text-paper-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-paper-accent animate-pulse" />
            <span>ATELIER D'ÉCRITURE POUR AUTEURS DE RAP</span>
          </div>

          <h1 className="text-hero-clamp font-serif font-normal text-paper-text leading-[0.92] tracking-[-0.03em]">
            L'encre sèche,
            <br />
            <span className="italic font-normal">les rimes restent.</span>
          </h1>

          <p className="text-hero-sub text-paper-muted font-sans font-normal leading-relaxed max-w-xl">
            Le cahier moderne des paroliers. Décompte des syllabes en direct, surlignage des
            assonances à la volée et horodatage certifié de chaque rime.
          </p>

          {/* CTA Principal & Lien Secondaire */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <Button
              asChild
              variant="primary"
              size="lg"
              iconRight={<ArrowRight />}
              fullWidth
              className="sm:w-auto"
            >
              <Link to="/register">Commencer à écrire</Link>
            </Button>

            <Button asChild variant="ghost" size="lg" iconRight={<ArrowDown />}>
              <a href="#ecrire">Tester l'atelier interactif</a>
            </Button>
          </div>

          {/* Micro-engagements authentiques (sans faux chiffres ni logos inventés) */}
          <div className="pt-6 border-t border-paper-border/60 flex flex-wrap items-center gap-6 text-xs font-mono text-paper-muted">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-paper-accent" />
              <span>Chiffrement & Propriété absolue</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-paper-accent" />
              <span>Zéro entraînement de modèles IA</span>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Feuille de rap signature animée */}
        <div className="lg:col-span-6 lg:pl-6">
          <RapSheetSignature />
        </div>
      </div>
    </section>
  );
}
