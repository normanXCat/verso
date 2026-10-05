import { describe, expect, it } from 'vitest';
import { decideSyncAction } from './offline-storage.js';

describe('decideSyncAction', () => {
  it('considère le texte synchronisé si le serveur porte déjà le contenu local', () => {
    expect(
      decideSyncAction({
        serverContent: 'même contenu',
        localContent: 'même contenu',
        baseContent: 'base ancienne',
      }),
    ).toBe('up-to-date');
  });

  it('applique le contenu local si le serveur n’a pas bougé depuis la base', () => {
    expect(
      decideSyncAction({
        serverContent: 'base',
        localContent: 'édition hors ligne',
        baseContent: 'base',
      }),
    ).toBe('apply-local');
  });

  it('détecte un conflit quand le serveur a divergé (autre appareil)', () => {
    expect(
      decideSyncAction({
        serverContent: 'modifié ailleurs',
        localContent: 'édition hors ligne',
        baseContent: 'base',
      }),
    ).toBe('conflict');
  });

  it('préserve le contenu local en conflit si le texte distant a disparu', () => {
    expect(
      decideSyncAction({
        serverContent: null,
        localContent: 'édition hors ligne',
        baseContent: 'base',
      }),
    ).toBe('conflict');
  });
});
