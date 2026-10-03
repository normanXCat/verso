import React from 'react';
import { Navbar } from '../components/landing/Navbar.js';
import { HeroSection } from '../components/landing/HeroSection.js';
import { EditorSection } from '../components/landing/EditorSection.js';
import { OrganizeSection } from '../components/landing/OrganizeSection.js';
import { InstrumentalsSection } from '../components/landing/InstrumentalsSection.js';
import { ProtectSection } from '../components/landing/ProtectSection.js';
import { HowItWorksSection } from '../components/landing/HowItWorksSection.js';
import { FinalCtaSection } from '../components/landing/FinalCtaSection.js';
import { Footer } from '../components/landing/Footer.js';

export function LandingPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-paper-bg text-paper-text font-sans antialiased selection:bg-paper-accent/20 selection:text-paper-accent relative">
      {/* Navigation fine et sticky */}
      <Navbar />

      {/* Contenu principal */}
      <main>
        {/* 01. Hero avec feuille signature animée */}
        <HeroSection />

        {/* 02. Section Écrire : Mockup interactif */}
        <EditorSection />

        {/* 03. Section Organiser : Piles d'albums et tracklist */}
        <OrganizeSection />

        {/* 04. Section Instrus : Lecteur audio et BPM */}
        <InstrumentalsSection />

        {/* 05. Section Protéger : Frise d'horodatage */}
        <ProtectSection />

        {/* 06. Comment ça marche : 3 étapes */}
        <HowItWorksSection />

        {/* 07. CTA final pleine largeur sur fond encre */}
        <FinalCtaSection />
      </main>

      {/* Footer sobre */}
      <Footer />
    </div>
  );
}

export default LandingPage;
