import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button.js';

export function FinalCtaSection(): React.ReactElement {
  return (
    <section className="w-full bg-[#14110F] text-[#EDE6D8] py-24 sm:py-32 px-6 md:px-12 relative overflow-hidden paper-grain">
      {/* Texture subtile en filigrane */}
      <div className="absolute inset-0 opacity-5 pointer-events-none notebook-ruled" />

      <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
        <span className="text-xs font-mono uppercase tracking-widest text-[#9A9183] block">
          L'Atelier d'Écriture Verso
        </span>

        <h2 className="text-4xl sm:text-6xl md:text-7xl font-serif font-normal leading-[1.05] tracking-tight">
          Vos textes méritent mieux <br />
          <span className="italic">qu'un bloc-notes oublié.</span>
        </h2>

        <p className="text-[#9A9183] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-sans">
          Démarrez une nouvelle session dès aujourd'hui. Vos mesures restent vôtres, chiffrées,
          synchronisées et protégées dès le premier jet.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            variant="primary"
            size="lg"
            iconRight={<ArrowRight />}
            className="bg-[#D9421C] hover:bg-[#bf3614] text-white shadow-lg shadow-black/40"
          >
            <Link to="/register">Ouvrir mon carnet d'écriture</Link>
          </Button>
        </div>

        <div className="pt-8 text-xs font-mono text-[#9A9183] flex items-center justify-center gap-6">
          <span>Inscription en 30 secondes</span>
          <span>•</span>
          <span>Gratuit et sans engagement</span>
        </div>
      </div>
    </section>
  );
}
