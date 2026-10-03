import React from 'react';
import { Link } from 'react-router-dom';

export function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-paper-border bg-paper-surface py-16 px-6 md:px-12 text-sm text-paper-muted">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Colonne Identité */}
        <div className="md:col-span-5 space-y-4">
          <Link to="/" className="inline-flex items-baseline gap-1 group">
            <span className="font-serif text-3xl font-normal text-paper-text tracking-tight group-hover:text-paper-accent transition-colors">
              Verso
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-paper-accent translate-y-[-2px]" />
          </Link>

          <p className="text-paper-muted max-w-sm text-xs sm:text-sm leading-relaxed font-sans">
            Cahier de travail dédié aux paroliers et artistes de rap. Conçu pour la mesure,
            l'exigence métrique et la préservation inaliénable de la propriété intellectuelle.
          </p>

          <div className="pt-2 text-xs font-mono text-paper-muted/80">
            <span>Hébergé en Europe • Zéro scraping IA • Chiffrement au repos</span>
          </div>
        </div>

        {/* Colonne Navigation */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-paper-text font-semibold">
            L'Atelier
          </h4>
          <ul className="space-y-2 text-xs sm:text-sm font-sans">
            <li>
              <a href="#ecrire" className="hover:text-paper-text transition-colors">
                Éditeur métrique
              </a>
            </li>
            <li>
              <a href="#organiser" className="hover:text-paper-text transition-colors">
                Organisation des albums
              </a>
            </li>
            <li>
              <a href="#instrus" className="hover:text-paper-text transition-colors">
                Lecteur & bouclage audio
              </a>
            </li>
            <li>
              <a href="#proteger" className="hover:text-paper-text transition-colors">
                Horodatage cryptographique
              </a>
            </li>
            <li>
              <a href="#methode" className="hover:text-paper-text transition-colors">
                Méthode de travail
              </a>
            </li>
          </ul>
        </div>

        {/* Colonne Compte & Technique */}
        <div className="md:col-span-4 space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-paper-text font-semibold">
            Accès & Outils
          </h4>
          <ul className="space-y-2 text-xs sm:text-sm font-sans">
            <li>
              <Link to="/login" className="hover:text-paper-text transition-colors">
                Connexion à l'espace
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-paper-text transition-colors">
                Créer un carnet d'écriture
              </Link>
            </li>
            <li>
              <Link to="/sessions" className="hover:text-paper-text transition-colors">
                Gestion des sessions & appareils
              </Link>
            </li>
            <li>
              <Link to="/design" className="hover:text-paper-accent transition-colors">
                Démonstrateur Design System (/design)
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Ligne de clôture */}
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-paper-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-paper-muted">
        <span>© {new Date().getFullYear()} Verso. Conçu pour le flow et la plume.</span>
        <span>Direction artistique « Encre & Papier »</span>
      </div>
    </footer>
  );
}
