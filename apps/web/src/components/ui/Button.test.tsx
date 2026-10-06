// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ArrowRight, PenLine } from 'lucide-react';
import { Button } from './Button.js';

afterEach(cleanup);

describe('Button', () => {
  it('aligne icône et texte sur une seule ligne (inline-flex, items-center, gap, nowrap)', () => {
    render(<Button iconLeft={<PenLine />}>Écrire un texte</Button>);

    const button = screen.getByRole('button', { name: 'Écrire un texte' });
    expect(button.className).toContain('inline-flex');
    expect(button.className).toContain('items-center');
    expect(button.className).toContain('justify-center');
    expect(button.className).toContain('gap-2');
    expect(button.className).toContain('whitespace-nowrap');
  });

  it('place une icône à droite avec un emplacement fixe masqué aux lecteurs d’écran', () => {
    render(<Button iconRight={<ArrowRight />}>Ouvrir mon carnet</Button>);

    const button = screen.getByRole('button', { name: 'Ouvrir mon carnet' });
    const iconSlot = button.querySelector('[aria-hidden="true"]');
    expect(iconSlot).not.toBeNull();
    expect(iconSlot?.className).toContain('w-5');
    expect(iconSlot?.className).toContain('shrink-0');
    // La flèche se décale au survol (transition de 2 px).
    expect(iconSlot?.className).toContain('group-hover/btn:translate-x-0.5');
    expect(iconSlot?.className).toContain('motion-reduce:transition-none');
  });

  it('expose un bouton icône seule via aria-label, sans texte', () => {
    render(
      <Button size="icon" iconOnly iconLeft={<ArrowRight />} aria-label="Télécharger le texte" />,
    );

    const button = screen.getByRole('button', { name: 'Télécharger le texte' });
    expect(button.textContent).toBe('');
    expect(button.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('en chargement : désactivé, indicateur à la place de l’icône et largeur inchangée', () => {
    const { unmount } = render(<Button iconRight={<ArrowRight />}>Enregistrer</Button>);
    const idle = screen.getByRole('button', { name: 'Enregistrer' });
    const idleClasses = idle.className;
    unmount();

    render(
      <Button iconRight={<ArrowRight />} loading loadingText="Enregistrement…">
        Enregistrer
      </Button>,
    );
    const loadingButton = screen.getByRole('button') as HTMLButtonElement;
    expect(loadingButton.disabled).toBe(true);
    expect(loadingButton.textContent).toContain('Enregistrement…');
    // L'indicateur remplace l'icône dans le même emplacement.
    expect(loadingButton.querySelector('.animate-spin')).not.toBeNull();
    expect(loadingButton.querySelectorAll('span[aria-hidden="true"]').length).toBe(1);
    // Les classes de dimension (hauteur / padding / largeur) restent identiques.
    expect(loadingButton.className).toBe(idleClasses);
  });

  it('asChild : rend un lien avec exactement le style d’un bouton', () => {
    render(
      <Button asChild variant="primary" iconRight={<ArrowRight />}>
        <a href="/register">Créer un carnet</a>
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Créer un carnet' });
    expect(link.className).toContain('inline-flex');
    expect(link.className).toContain('items-center');
    expect(link.className).toContain('h-11');
    expect(link.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
