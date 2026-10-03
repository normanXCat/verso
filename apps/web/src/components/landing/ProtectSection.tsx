import React from 'react';
import { ShieldCheck, Lock, Fingerprint, FileCheck } from 'lucide-react';
import { Tag } from '../ui/Tag.js';

interface HistoryStep {
  version: string;
  time: string;
  title: string;
  hash: string;
  diff: string;
  isInitial?: boolean;
}

const TIMELINE_STEPS: HistoryStep[] = [
  {
    version: 'v14',
    time: 'Aujourd’hui à 17:42:10 UTC',
    title: 'Restructuration du refrain et chute finale',
    hash: 'sha256:7f9b8c3e21...d0a301',
    diff: '+4 mesures • 2 rimes ajustées',
  },
  {
    version: 'v08',
    time: 'Hier à 23:18:04 UTC',
    title: 'Couplet 2 complet calé sur le tempo',
    hash: 'sha256:4a1d9018f2...9b692f',
    diff: '+16 mesures • Cadence 88 BPM validée',
  },
  {
    version: 'v01',
    time: '28 Septembre 2026 à 14:02:11 UTC',
    title: 'Genèse de l’œuvre — Premier jet original',
    hash: 'sha256:11e05da44c...987c04',
    diff: 'Création initiale du document • Horodatage certifié',
    isInitial: true,
  },
];

export function ProtectSection(): React.ReactElement {
  return (
    <section
      id="proteger"
      className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-paper-border/60"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Colonne gauche : Présentation de la protection */}
        <div className="lg:col-span-5 space-y-6">
          <span className="text-xs font-mono text-paper-muted uppercase tracking-wider block">
            04 — La Propriété Intellectuelle
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-paper-text tracking-tight">
            L'horodatage immuable <br />
            <span className="italic">de chaque mot.</span>
          </h2>
          <p className="text-paper-muted text-base leading-relaxed">
            La paternité d'un texte commence dès le premier jet. Verso scelle chaque sauvegarde avec
            une empreinte cryptographique irréfutable, constituant une preuve tangible
            d'antériorité.
          </p>

          <div className="p-5 rounded-lg border border-paper-border bg-paper-surface space-y-3">
            <div className="flex items-center gap-2 text-paper-text font-serif text-lg">
              <ShieldCheck className="w-5 h-5 text-paper-accent" />
              <span>Engagement d'intégrité absolue</span>
            </div>
            <p className="text-xs text-paper-muted leading-relaxed font-sans">
              Aucune de vos paroles, aucun de vos refrains n'est utilisé pour entraîner des modèles
              d'intelligence artificielle. Vos créations restent privées, chiffrées et vous
              appartiennent à 100%.
            </p>
          </div>
        </div>

        {/* Colonne droite : Frise chronologique verticale d'horodatage */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-paper-border bg-paper-surface p-6 sm:p-8 shadow-paper-lg paper-grain">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-paper-border">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-paper-accent" />
                <h3 className="font-serif text-xl text-paper-text">
                  Journal d'Antériorité Certifié
                </h3>
              </div>
              <Tag variant="accent">Immuable</Tag>
            </div>

            {/* Frise verticale */}
            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-paper-border">
              {TIMELINE_STEPS.map((step, idx) => (
                <div key={step.version} className="relative group">
                  {/* Point sur la ligne verticale */}
                  <div
                    className={`absolute -left-[29px] sm:-left-[33px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-paper-surface transition-transform group-hover:scale-125 ${
                      idx === 0
                        ? 'bg-paper-accent ring-4 ring-paper-accent/20'
                        : step.isInitial
                          ? 'bg-paper-accent'
                          : 'bg-paper-muted'
                    }`}
                  />

                  {/* Contenu du bloc historique */}
                  <div className="p-4 rounded-lg border border-paper-border bg-paper-bg space-y-2 transition-colors hover:border-paper-accent/40">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Tag variant={step.isInitial ? 'accent' : 'neutral'} mono>
                          {step.version}
                        </Tag>
                        <h4 className="font-medium text-sm text-paper-text">{step.title}</h4>
                      </div>
                      <span className="text-[11px] font-mono text-paper-muted">{step.time}</span>
                    </div>

                    <p className="text-xs text-paper-muted font-sans">{step.diff}</p>

                    <div className="pt-2 border-t border-paper-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-paper-muted">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-paper-accent" />
                        <span className="font-mono">{step.hash}</span>
                      </div>
                      {step.isInitial && (
                        <span className="flex items-center gap-1 text-paper-accent font-medium">
                          <FileCheck className="w-3 h-3" />
                          Preuve d'antériorité originale
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-paper-border/60 flex items-center justify-between text-xs font-mono text-paper-muted">
              <span>Condensat cryptographique calculé localement</span>
              <span className="text-paper-text font-medium">Exportable pour dépôt SACEM</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
