import React from 'react';

const STEPS = [
  {
    num: '01',
    title: 'Posez vos rimes sans distraction',
    text: 'Ouvrez une feuille vierge, lancez votre instru et écrivez au fil de la plume. Le décompte syllabique instantané et la détection des rimes soutiennent votre rythme sans jamais interrompre la spontanéité du flow.',
  },
  {
    num: '02',
    title: 'Assemblez vos projets et albums',
    text: "Ne perdez plus un morceau dans un bloc-notes éparpillé. Classez vos couplets par disques, agencez votre tracklist pour vérifier la narration d'ensemble et notez le tempo précis de chaque maquette.",
  },
  {
    num: '03',
    title: 'Scellez votre antériorité d’auteur',
    text: "Chaque enregistrement génère un condensat cryptographique horodaté. Vous conservez l'historique complet et irréfutable de la genèse de vos textes, prêt pour toute démarche de dépôt légal.",
  },
];

export function HowItWorksSection(): React.ReactElement {
  return (
    <section
      id="methode"
      className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-paper-border/60"
    >
      <div className="max-w-xl mb-16">
        <span className="text-xs font-mono text-paper-muted uppercase tracking-wider block mb-3">
          Processus d'écriture
        </span>
        <h2 className="text-4xl md:text-5xl font-serif text-paper-text tracking-tight">
          Trois temps pour <br />
          <span className="italic">poser l'essentiel.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
        {STEPS.map((step) => (
          <div
            key={step.num}
            className="p-8 rounded-lg border border-paper-border bg-paper-surface relative group hover:border-paper-accent/50 transition-colors shadow-paper-sm"
          >
            {/* Grand chiffre en Instrument Serif */}
            <span className="text-6xl md:text-7xl font-serif text-paper-accent/70 font-normal leading-none block mb-6 select-none transition-colors group-hover:text-paper-accent">
              {step.num}
            </span>

            <h3 className="font-serif text-2xl text-paper-text mb-3 leading-snug">{step.title}</h3>

            <p className="text-paper-muted text-sm leading-relaxed font-sans">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
