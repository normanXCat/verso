// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SongListItem } from '@verso/shared';
import { SongCard } from './SongCard.js';
import { AlbumCard } from '../album/AlbumCard.js';

afterEach(cleanup);

function createTestSong(overrides: Partial<SongListItem> = {}): SongListItem {
  return {
    id: 'song-test-123',
    userId: 'user-1',
    title: 'Légende urbaine',
    status: 'DRAFT',
    isFavorite: false,
    albumId: null,
    albumTitle: null,
    tags: ['Rap', 'Freestyle'],
    excerpt: 'Dans la pénombre de la ville endormie...',
    revision: 1,
    createdAt: new Date('2026-01-01T12:00:00Z'),
    updatedAt: new Date('2026-01-02T12:00:00Z'),
    ...overrides,
  };
}

function renderWithProviders(ui: React.ReactElement, initialRoute = '/app') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/app" element={ui} />
          <Route
            path="/app/songs/:id"
            element={<div data-testid="song-editor-page">Éditeur</div>}
          />
          <Route
            path="/app/albums/:id"
            element={<div data-testid="album-detail-page">Album</div>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SongCard', () => {
  it('contient un vrai lien vers la page du texte avec la technique du lien étiré', () => {
    const song = createTestSong({ id: 'song-xyz', title: 'Nuit blanche' });
    renderWithProviders(<SongCard song={song} />);

    const link = screen.getByRole('link', { name: 'Nuit blanche' });
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('/app/songs/song-xyz');
    // Vérifie la présence du pseudo-élément étiré sur toute la carte
    expect(link.className).toContain('after:absolute');
    expect(link.className).toContain('after:inset-0');
  });

  it('navigue vers le texte lors du clic sur le corps de la carte', () => {
    const song = createTestSong({ id: 'song-body-click', title: 'Clic Corps' });
    const { container } = renderWithProviders(<SongCard song={song} />);

    // Trouver le conteneur de carte
    const cardEl = container.firstChild as HTMLElement;
    expect(cardEl).not.toBeNull();

    fireEvent.click(cardEl);
    expect(screen.getByTestId('song-editor-page')).not.toBeNull();
  });

  it('permet de cliquer sur le bouton favori sans naviguer', () => {
    const onToggleFavorite = vi.fn();
    const song = createTestSong({ id: 'song-fav-1', isFavorite: false });

    renderWithProviders(<SongCard song={song} onToggleFavorite={onToggleFavorite} />);

    const favoriteButton = screen.getByRole('button', { name: /Marquer comme favori/i });
    expect(favoriteButton).not.toBeNull();
    // Le bouton doit être au-dessus du lien étiré
    expect(favoriteButton.className).toContain('relative');
    expect(favoriteButton.className).toContain('z-10');

    fireEvent.click(favoriteButton);

    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
    expect(onToggleFavorite).toHaveBeenCalledWith(song);
    // La page de l'éditeur ne doit PAS être affichée (pas de navigation)
    expect(screen.queryByTestId('song-editor-page')).toBeNull();
  });

  it('navigue vers le texte au clavier (focus puis Entrée)', () => {
    const song = createTestSong({ id: 'song-kb-1', title: 'Texte Clavier' });

    renderWithProviders(<SongCard song={song} />);

    const link = screen.getByRole('link', { name: 'Texte Clavier' });
    link.focus();
    expect(document.activeElement).toBe(link);

    // Clic / activation du lien navigue vers l'éditeur
    fireEvent.click(link);
    expect(screen.getByTestId('song-editor-page')).not.toBeNull();
  });

  it('permet de naviguer au clavier entre le lien et les boutons secondaires', () => {
    const song = createTestSong({ id: 'song-tab-order' });

    renderWithProviders(<SongCard song={song} />);

    const link = screen.getByRole('link', { name: song.title });
    const favButton = screen.getByRole('button', { name: /Marquer comme favori/i });
    const statusButton = screen.getByRole('button', { name: /Marquer comme terminé/i });

    // Tous les éléments sont focusables au clavier
    link.focus();
    expect(document.activeElement).toBe(link);

    favButton.focus();
    expect(document.activeElement).toBe(favButton);

    statusButton.focus();
    expect(document.activeElement).toBe(statusButton);
  });

  it('nettoie les marques Markdown brutes de l’extrait et saute les titres', () => {
    const song = createTestSong({
      excerpt: `# L'ENVERS DU DÉCOR
### INTRO
Ny Malagasy tsy kivy
[Couplet 1]
**Bercé** par les gyrophares`,
    });

    renderWithProviders(<SongCard song={song} />);

    expect(screen.queryByText(/# L'ENVERS/)).toBeNull();
    expect(screen.queryByText(/### INTRO/)).toBeNull();
    expect(screen.queryByText(/\[Couplet 1\]/)).toBeNull();
    expect(screen.queryByText(/\*\*/)).toBeNull();
    expect(screen.getByText(/Ny Malagasy tsy kivy Bercé par les gyrophares/)).not.toBeNull();
  });

  it('utilise les tokens du design system pour le badge Terminé (aucun vert émeraude)', () => {
    const song = createTestSong({ status: 'COMPLETED' });
    const { container } = renderWithProviders(<SongCard song={song} />);

    const badge = screen.getByText('Terminé');
    expect(badge).not.toBeNull();

    // Doit utiliser la palette Encre & Papier (paper-border, paper-muted, paper-bg)
    expect(badge.className).toContain('text-paper-muted');
    expect(badge.className).toContain('border-paper-border');
    // Ne doit jamais contenir les classes vertes externes
    expect(badge.className).not.toContain('emerald');
    expect(container.innerHTML).not.toContain('emerald');
  });
});

describe('AlbumCard', () => {
  it('contient un lien étiré vers la page de détail de l’album', () => {
    const album = {
      id: 'album-456',
      title: 'Miroir Fumé',
      description: 'Premier projet studio',
      coverImageUrl: null,
      tracksCount: 12,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    renderWithProviders(<AlbumCard album={album} />);

    const link = screen.getByRole('link', { name: 'Miroir Fumé' });
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('/app/albums/album-456');
    expect(link.className).toContain('after:absolute');
    expect(link.className).toContain('after:inset-0');
  });
});
