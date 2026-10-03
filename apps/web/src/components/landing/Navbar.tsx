import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ThemeSwitch } from '../common/ThemeSwitch.js';
import { Button } from '../ui/Button.js';
import { useAuth } from '../../hooks/useAuth.js';

export function Navbar(): React.ReactElement {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const handleScroll = (): void => {
      if (window.scrollY > 24) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Écrire', href: '#ecrire' },
    { label: 'Organiser', href: '#organiser' },
    { label: 'Instrus', href: '#instrus' },
    { label: 'Protéger', href: '#proteger' },
    { label: 'Méthode', href: '#methode' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'py-3 bg-paper-bg/90 backdrop-blur-md border-b border-paper-border shadow-paper-sm'
          : 'py-6 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo Verso */}
        <Link to="/" className="flex items-baseline gap-1 group">
          <span className="font-serif text-3xl font-normal tracking-tight text-paper-text transition-colors group-hover:text-paper-accent">
            Verso
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-paper-accent translate-y-[-2px]" />
        </Link>

        {/* Liens Desktop */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-paper-muted">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-paper-text font-medium relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-paper-accent hover:after:w-full after:transition-all after:duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions & Authentification */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeSwitch />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/app"
                className="text-xs font-mono text-paper-muted hover:text-paper-text transition-colors px-2 py-1 border border-paper-border rounded"
              >
                {user.displayName || user.email}
              </Link>
              <Link to="/app">
                <Button variant="secondary" size="sm">
                  Mon espace
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-paper-text hover:text-paper-accent transition-colors px-3 py-1.5"
              >
                Se connecter
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Commencer
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Bouton Menu Mobile */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeSwitch />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-paper-text hover:text-paper-accent focus:outline-none"
            aria-label="Basculer le menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menu Déroulant Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-paper-border bg-paper-surface px-6 py-6 shadow-paper-md animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-4 text-base">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-paper-muted hover:text-paper-text font-medium py-1 border-b border-paper-border/40"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              {isAuthenticated && user ? (
                <Link to="/app" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Mon espace ({user.displayName || user.email})
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" className="w-full">
                      Se connecter
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" className="w-full">
                      Commencer à écrire
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
