import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, User, X } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle.js';
import { Logo } from '../common/Logo.js';
import { Button } from '../ui/Button.js';
import { NavLink } from '../ui/NavLink.js';
import { useAuth } from '../../hooks/useAuth.js';

const NAV_LINKS = [
  { label: 'Écrire', href: '#ecrire' },
  { label: 'Organiser', href: '#organiser' },
  { label: 'Instrus', href: '#instrus' },
  { label: 'Protéger', href: '#proteger' },
  { label: 'Méthode', href: '#methode' },
];

/** Seuil (px) de passage à la barre compacte. */
const SCROLL_COMPACT = 24;
/** Au-delà de cette distance, le bandeau de vérification a quitté l'écran. */
const SCROLL_PAST_BANNER = 48;

export function Navbar(): React.ReactElement {
  const [isScrolled, setIsScrolled] = useState(false);
  const [pastBanner, setPastBanner] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  // Barre compacte + décalage sous le bandeau de vérification email.
  useEffect(() => {
    const handleScroll = (): void => {
      const y = window.scrollY;
      setIsScrolled(y > SCROLL_COMPACT);
      setPastBanner(y > SCROLL_PAST_BANNER);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // État actif : la section visible la plus avancée (ligne de lecture à 35 % de l'écran).
  useEffect(() => {
    const ids = NAV_LINKS.map((link) => link.href.slice(1));

    const handleScroll = (): void => {
      const readingLine = window.innerHeight * 0.35;
      let current: string | null = null;

      for (const id of ids) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= readingLine) {
          current = id;
        }
      }

      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const displayName = user?.displayName || user?.email || '';

  return (
    <header
      // Le bandeau de vérification est dans le flux, au-dessus : la barre fixe se décale
      // exactement de sa hauteur (`--banner-h`) tant qu'il est à l'écran, puis revient à 0.
      style={{ top: pastBanner ? '0px' : 'var(--banner-h, 0px)' }}
      className={`fixed left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-paper-bg/90 py-3 border-b border-paper-border shadow-paper-sm backdrop-blur-md'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 md:px-12">
        {/* Logo Verso */}
        <Link
          to="/"
          aria-label="Verso — retour à l'accueil"
          className="flex items-center text-paper-text no-underline transition-colors hover:text-paper-accent"
        >
          <Logo size="lg" title="Verso" />
        </Link>

        {/* Liens Desktop */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Sections de la page">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              isActive={activeSection === link.href.slice(1)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions & Authentification */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <>
              <Button asChild variant="ghost" size="sm" iconLeft={<User className="h-4 w-4" />}>
                <Link to="/app" title={displayName}>
                  <span className="inline-block max-w-[10rem] truncate align-bottom">
                    {displayName}
                  </span>
                </Link>
              </Button>
              <Button asChild variant="primary" size="sm">
                <Link to="/app">Mon espace</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Se connecter</Link>
              </Button>
              <Button asChild variant="primary" size="sm">
                <Link to="/register">Commencer</Link>
              </Button>
            </>
          )}
        </div>

        {/* Bouton Menu Mobile */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            iconOnly
            aria-label="Basculer le menu"
            aria-expanded={mobileMenuOpen}
            iconLeft={mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            onClick={() => setMobileMenuOpen((open) => !open)}
          />
        </div>
      </div>

      {/* Menu Déroulant Mobile */}
      {mobileMenuOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 border-b border-paper-border bg-paper-surface px-6 py-6 shadow-paper-md duration-200 md:hidden">
          <nav className="flex flex-col gap-4 text-base" aria-label="Sections de la page">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="border-b border-paper-border/40 py-1 font-medium text-paper-muted no-underline transition-colors hover:text-paper-text"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4">
              {isAuthenticated && user ? (
                <Button asChild variant="primary" fullWidth>
                  <Link to="/app" onClick={() => setMobileMenuOpen(false)}>
                    Mon espace ({displayName})
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="secondary" fullWidth>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      Se connecter
                    </Link>
                  </Button>
                  <Button asChild variant="primary" fullWidth>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      Commencer à écrire
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
