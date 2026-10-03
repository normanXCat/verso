import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface VerseLine {
  num: string;
  syllables: number;
  prefix: string;
  rhyme: string;
  suffix: string;
  rhymeGroup: 'A' | 'B' | 'C';
}

const LYRICS: VerseLine[] = [
  {
    num: '01',
    syllables: 12,
    prefix: 'Sous la lueur dorée des lampadaires ',
    rhyme: 'éteints,',
    suffix: '',
    rhymeGroup: 'A',
  },
  {
    num: '02',
    syllables: 12,
    prefix: 'Je calcule le silence avant le petit ',
    rhyme: 'matin.',
    suffix: '',
    rhymeGroup: 'A',
  },
  {
    num: '03',
    syllables: 14,
    prefix: 'L’encre mord le papier sans trembler d’un ',
    rhyme: 'millimètre,',
    suffix: '',
    rhymeGroup: 'B',
  },
  {
    num: '04',
    syllables: 14,
    prefix: 'Chaque mot dans la marge attend de ',
    rhyme: 'réapparaître.',
    suffix: '',
    rhymeGroup: 'B',
  },
  {
    num: '05',
    syllables: 14,
    prefix: 'Cent fois la boucle tourne au tempo du ',
    rhyme: 'métronome,',
    suffix: '',
    rhymeGroup: 'C',
  },
  {
    num: '06',
    syllables: 14,
    prefix: 'Pour graver sur la feuille ce qui libère un ',
    rhyme: 'homme.',
    suffix: '',
    rhymeGroup: 'C',
  },
];

export function RapSheetSignature(): React.ReactElement {
  const shouldReduceMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(shouldReduceMotion ? LYRICS.length : 1);
  const [highlightedGroup, setHighlightedGroup] = useState<string | null>(null);

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisibleCount(LYRICS.length);
      return;
    }

    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev < LYRICS.length) {
          return prev + 1;
        }
        return prev;
      });
    }, 850);

    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  return (
    <div className="relative w-full max-w-xl mx-auto lg:max-w-none">
      {/* Ombre portée et fond de cahier superposé */}
      <div className="absolute -inset-1.5 rounded-lg bg-paper-border/60 -rotate-1 hidden sm:block pointer-events-none" />
      <div className="absolute -inset-0.5 rounded-lg bg-paper-border/40 rotate-1 hidden sm:block pointer-events-none" />

      {/* Feuille de cahier principale */}
      <div className="relative rounded-lg bg-paper-surface border border-paper-border shadow-paper-lg p-6 sm:p-8 paper-grain overflow-hidden">
        {/* Entête du feuillet */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-paper-border/70 text-xs font-mono text-paper-muted">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full bg-paper-accent" />
            <span className="font-semibold text-paper-text uppercase tracking-wider">
              Cahier de Session
            </span>
            <span className="text-paper-border">•</span>
            <span>Morceau 04</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">88 BPM • Fa m</span>
            <span className="text-paper-border hidden sm:inline">•</span>
            <span className="text-paper-accent font-medium">Auto-sauvegardé</span>
          </div>
        </div>

        {/* Corps avec marge rouge de cahier et réglures */}
        <div className="relative pl-6 sm:pl-10 notebook-margin">
          <div className="space-y-4 font-mono text-sm sm:text-base leading-relaxed">
            {LYRICS.map((line, idx) => {
              const isVisible = idx < visibleCount;
              const isGroupActive = highlightedGroup === line.rhymeGroup;

              return (
                <motion.div
                  key={line.num}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                  animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  onMouseEnter={() => setHighlightedGroup(line.rhymeGroup)}
                  onMouseLeave={() => setHighlightedGroup(null)}
                  className={`group flex items-baseline justify-between gap-3 py-1 px-1.5 rounded transition-colors ${
                    isGroupActive ? 'bg-paper-accent/5' : 'hover:bg-paper-border/20'
                  }`}
                >
                  {/* Numéro de ligne et texte */}
                  <div className="flex items-baseline gap-3 sm:gap-4 flex-1 min-w-0">
                    <span className="text-xs font-mono text-paper-muted/60 select-none w-5 text-right shrink-0">
                      {line.num}
                    </span>
                    <p className="text-paper-text tracking-tight truncate sm:whitespace-normal">
                      <span>{line.prefix}</span>
                      <span
                        className={`transition-all duration-300 font-medium px-1 rounded-sm ${
                          isVisible
                            ? isGroupActive
                              ? 'bg-paper-accent text-paper-bg shadow-sm'
                              : 'text-paper-accent bg-paper-accent/15 border-b border-paper-accent/60'
                            : 'text-paper-text'
                        }`}
                      >
                        {line.rhyme}
                      </span>
                    </p>
                  </div>

                  {/* Compteur de syllabes en Geist Mono */}
                  <div className="shrink-0 flex items-center gap-1.5 select-none pl-2">
                    <span
                      className={`text-xs font-mono transition-colors ${
                        isGroupActive
                          ? 'text-paper-accent font-semibold'
                          : 'text-paper-muted group-hover:text-paper-text'
                      }`}
                    >
                      {line.syllables}
                    </span>
                    <span className="text-[10px] uppercase font-mono text-paper-muted/60">syl</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Curseur d'écriture animé au bout de la dernière ligne révélée */}
          {visibleCount < LYRICS.length && !shouldReduceMotion && (
            <motion.div
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="mt-3 ml-10 w-2 h-4 bg-paper-accent inline-block"
            />
          )}
        </div>

        {/* Pied du feuillet : Légende discrète */}
        <div className="mt-8 pt-4 border-t border-paper-border/60 flex items-center justify-between text-[11px] font-mono text-paper-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-xs bg-paper-accent/20 border border-paper-accent" />
              Rimes embrassées (A-A-B-B-C-C)
            </span>
          </div>
          <span className="italic">Survoler une rime pour révéler la cadence</span>
        </div>
      </div>
    </div>
  );
}
